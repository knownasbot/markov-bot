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
import { ShardingManager, MessageEmbed, WebhookClient } from "discord.js";
import { ChildProcess } from "child_process";

export default new class MarkovBOT {
    public manager = new ShardingManager(
        path.join(__dirname, process.env.NODE_ENV == "dev" ? "bot.ts" : "bot.js"),
        {
            token: process.env.TEST_BOT_TOKEN ?? process.env.BOT_TOKEN,
            execArgv: process.env.NODE_ENV == "dev" ? [ "--loader", "ts-node/esm" ] : null
        }
    );

    private webhook?: WebhookClient;

    constructor() {
        this.manager.on("shardCreate", (shard) => {
            const shardTag = `[Shard ${shard.id}]`;

            console.log(shardTag, "Starting new shard...");

            if (this.webhook) {
                let embed = new MessageEmbed()
                    .setTitle("Shard status")
                    .setColor(0xedca31)
                    .setDescription(`Shard ${shard.id} is starting.`)
                    .setTimestamp();

                this.webhook.send({ embeds: [ embed ] })
                    .catch(e => console.error("[Webhook Log]", e));
            }

            shard.on("ready", () => {
                console.log(shardTag, "Connected to Discord.");

                if (this.webhook) {
                    let embed = new MessageEmbed()
                        .setTitle("Shard status")
                        .setColor(0x32d35b)
                        .setDescription(`Shard ${shard.id} just connected to Discord.`)
                        .setTimestamp();
    
                    this.webhook.send({ embeds: [ embed ] })
                        .catch(e => console.error("[Webhook Log]", e));
                }
            });

            // Listens to shards IPC messages. Used to share the new bans.
            shard.on("message", (message) => {
                if (message?.type != "ban" && message?.type != "unban") return;

                this.manager.broadcast(message);
            });

            shard.on("disconnect", () => {
                console.log(shardTag, "Disconnected.");

                if (this.webhook) {
                    let embed = new MessageEmbed()
                        .setTitle("Shard status")
                        .setColor(0xd33235)
                        .setDescription(`Shard ${shard.id} just disconnected.`)
                        .setTimestamp();
    
                    this.webhook.send({ embeds: [ embed ] })
                        .catch(e => console.error("[Webhook Log]", e));
                }
            });

            shard.on("death", (p: ChildProcess) => {
                console.log(shardTag, `Shard died. (exit code: ${p.exitCode})`);

                if (this.webhook) {
                    let embed = new MessageEmbed()
                        .setTitle("Shard status")
                        .setColor(0xd33235)
                        .setDescription(`Shard ${shard.id} died with exit code ${p.exitCode}.`)
                        .setTimestamp();
    
                    this.webhook.send({ embeds: [ embed ] })
                        .catch(e => console.error("[Webhook Log]", e));
                }
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

        if (process.env.SERVER_LOG) {
            this.webhook = new WebhookClient({ url: process.env.SERVER_LOG });
        }
    }
}