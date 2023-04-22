import GuildDatabase from "./GuildDatabase";
import BansModel from "./models/BansModel";
import ConfigModel from "./models/ConfigModel";
import NoTrackModel from "./models/NoTrackModel";
import TextsModel from "./models/TextsModel";

import ClientInterface from "../../interfaces/ClientInterface";

interface NoTrackInterface {
    lastActivity: number;
    toggled: boolean;
};

type CacheType = NoTrackInterface | GuildDatabase;
type Guildban = {
    type: "ban" | "unban";
    guildId: string;
    reason: string;
};

export default class DatabaseManager {
    public cache = new Map<string, CacheType>();

    private bans = new Map<string, string>();
    private client: ClientInterface;

    constructor(client: ClientInterface, sweepInterval: number = 10 * 60 * 60 * 1000) {
        this.client = client;

        this.fetchBans()
            .catch((e) => {
                console.error("[Database]", "Failed to fetch the bans:\n", e);
            });

        // Listens to all IPC messages sent by another shards
        process.on("message", (message:  | any) => {
            if (!message.guildId) return;

            if (message.type == "ban") {
                this.bans.set(message.guildId, message.reason);
            } else if (message.type == "unban") {
                this.bans.delete(message.guildId);
            }
        });

        setInterval(() => {
            this.cache.forEach((v, k) => {
                if (v.lastActivity <= Date.now() + sweepInterval) {
                    this.cache.delete(k);
                }
            });
        }, sweepInterval);

        setInterval(async () => {
            try {
                await TextsModel.deleteMany({ expiresAt: { $lte: Date.now() } }).exec();
            } catch(e) {
                console.error("[Database]", "Failed to delete inactive texts:\n", e);
            }
        }, 24 * 1000 * 60 * 60);
    }

    /**
     * Fetchs a guild database.
     * @param guildId Guild id.
     * @returns Guild database.
     */
    async fetch(guildId: string): Promise<GuildDatabase> {
        return new Promise((resolve) => {
            let guildDatabase = this.cache.get(guildId) as GuildDatabase;
            if (guildDatabase) {
                resolve(guildDatabase);
            } else {
                guildDatabase = new GuildDatabase(this.client, guildId);
                guildDatabase.once("ready", () => {
                    this.cache.set(guildId, guildDatabase);
                    resolve(guildDatabase);
                });
            }
        });
    }
    
    /**
     * Deletes a database;
     * @param guildId Guild id.
     */
    async delete(guildId: string): Promise<void> {
        try {
            this.cache.delete(guildId);

            await ConfigModel.deleteOne({ guildId }).exec();
            await TextsModel.deleteOne({ guildId }).exec();
        } catch(e) {
            console.error("[Database]", `Failed to delete the database of guild ${guildId}:\n`, e);
        }
    }

    /**
     * Bans the guild from using the bot.
     * @param guildID Guild's id.
     * @param reason The ban reason.
     */
     async ban(guildId: string, reason: string): Promise<void> {
        try {
            await BansModel.findOneAndUpdate({ guildId }, { reason }, { upsert: true, new: true }).exec();
            await this.delete(guildId);

            this.bans.set(guildId, reason);

            // Broadcasts the ban to all shards via IPC
            process.send({
                type: "ban",
                guildId,
                reason
            });

            return;
        } catch(e) {
            console.error("[Database]", `Failed to ban the guild ${guildId}:\n`, e);

            throw e;
        }
    }

    /**
     * Unbans the guild from using the bot.
     * @param guildID Guild's id.
     */
     async unban(guildId: string): Promise<void> {
        try {
            await BansModel.deleteOne({ guildId },).exec();

            this.bans.delete(guildId);

            // Broadcasts the ban to all shards via IPC
            process.send({
                type: "unban",
                guildId
            });

            return;
        } catch(e) {
            console.error("[Database]", `Failed to unban the guild ${guildId}:\n`, e);

            throw e;
        }
    }

    /**
     * Checks if the guild is banned from the bot.
     * @param guildId Guild's id.
     * @returns The ban reason if banned.
     */
     async isBanned(guildId: string): Promise<string | void> {
        return this.bans.get(guildId);
    }

    /**
     * Toggles the permission to collect the user's message.
     * @param userId User's id.
     * @returns The toggle state.
     */
    async toggleTrack(userId: string): Promise<boolean> {
        const key = "track-" + userId;

        try {
            const query = await NoTrackModel.deleteOne({ userId }).exec();
            
            if (query.deletedCount < 1) {
                await NoTrackModel.create({ userId });

                this.cache.set(key, {
                    lastActivity: Date.now(),
                    toggled: true
                });

                return true;
            } else {
                this.cache.set(key, {
                    lastActivity: Date.now(),
                    toggled: false
                });

                return false;
            }
        } catch(e) {
            console.error("[Database]", `Failed to toggle the message tracking of user ${userId}:\n`, e);

            throw e;
        }
    }

    /**
     * Checks if the bot is allowed to collect the user's messages.
     * @param userId User's id.
     * @returns If it's allowed.
     */
    async isTrackAllowed(userId: string): Promise<boolean> {
        const key = "track-" + userId;
        const state = this.cache.get(key) as NoTrackInterface;

        if (state) {
            state.lastActivity = Date.now();

            return !state.toggled;
        } else {
            try {
                const query = await NoTrackModel.exists({ userId });

                if (query) {
                    this.cache.set(key, {
                        lastActivity: Date.now(),
                        toggled: true
                    });

                    return false;
                } else {
                    this.cache.set(key, {
                        lastActivity: Date.now(),
                        toggled: false
                    });

                    return true;
                }
            } catch(e) {
                console.error("[Database]", `Failed to check message tracking of user ${userId}:\n`, e);

                throw e;
            }
        }
    }

    private async fetchBans() {
        const query = await BansModel.find({}).exec();

        for (let guild of query) {
            this.bans.set(guild.guildId, guild.reason);
        }

        return;
    }
}