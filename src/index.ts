import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.BOT_TOKEN && !process.env.TEST_BOT_TOKEN) {
    throw new Error("[env] Missing bot token");
} else if (!process.env.DB_URI) {
    throw new Error("[env] Missing database URI");
} else if (!process.env.CRYPTO_SECRET) {
    throw new Error("[env] Missing cryptography secret");
}

import * as path from "path";
import axios from "axios";
import { ShardingManager } from "discord.js";
import { ChildProcess } from "child_process";

export default new class MarkovBOT {
    public manager = new ShardingManager(
        path.join(__dirname, process.env.NODE_ENV == "dev" ? "bot.ts" : "bot.js"),
        {
            token: process.env.TEST_BOT_TOKEN ?? process.env.BOT_TOKEN,
            execArgv: process.env.NODE_ENV == "dev" ? [ "--loader", "ts-node/esm" ] : null
        }
    );

    constructor() {
        this.manager.on("shardCreate", (shard) => {
            const shardTag = `[Shard ${shard.id}]`;

            console.log(shardTag, "Starting new shard...");

            shard.on("ready", () => {
                console.log(shardTag, "Connected to Discord.");
            });

            // Listens to shards IPC messages. Used to share the new bans.
            shard.on("message", (message) => {
                if (message?.type != "ban" && message?.type != "unban") return;

                this.manager.broadcast(message);
            });

            shard.on("disconnect", () => console.log(shardTag, "Disconnected."));
            shard.on("death", (p: ChildProcess) => {
                console.log(shardTag, `Shard died. (exit code: ${p.exitCode})`);
            });
        });

        this.manager.spawn();

        if (process.env.TOPGG_TOKEN) {
            let clientId: string;
            let lastCount = 0;

            setInterval(async () => {
                if (!clientId) {
                    clientId = await this.manager.shards.first().fetchClientValue("user.id") as string;
                }

                let serverCount = (await this.manager.fetchClientValues("guilds.cache.size") as number[])
                    .reduce((a: number, b: number) => a + b);

                if (lastCount != serverCount) {
                    try {
                        await axios.post(`https://top.gg/api/bots/${clientId}/stats`, {
                            server_count: serverCount
                        }, {
                            headers: {
                                "Authorization": process.env.TOPGG_TOKEN
                            }
                        });

                        lastCount = serverCount;
                    } catch(e) {
                        console.error("[Top.gg]", "Failed to register top.gg stats:\n", e);
                    }
                }
            }, 60 * 60 * 1000);
        }
    }
}