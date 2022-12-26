import { EventEmitter } from "events";
import ConfigModel from "./models/ConfigModel";
import TextsModel from "./models/TextsModel";
import MarkovChains from "../markov/MarkovChains";

import ClientInterface from "../../interfaces/ClientInterface";

interface GuildDatabaseInterface {
    once(event: "ready", listener: Function): this;
}

interface DecryptedText {
    id: string;
    author: string;
    decrypted: string;
    encrypted: string;
};

export default class GuildDatabase extends EventEmitter implements GuildDatabaseInterface {
    public toggledActivity: boolean = false;

    public lastActivity: number = Date.now();
    public markovChains = new MarkovChains();

    public channelId: string;
    public webhook: string;
    public textsLimit: number = 500;
    public texts: DecryptedText[] = [];
    public collectPercentage: number;
    public sendingPercentage: number;
    public replyPercentage: number;

    private client: ClientInterface;
    private loadedConfig: boolean = false;
    private loadedTexts: boolean = false;
    private guildId: string;

    constructor(client: ClientInterface, guildId: string) {
        super();

        this.client = client;
        this.guildId = guildId;
        this.init();
    }

    /**
     * Changes the activity state of the bot in the guild.
     * @param state Enabled or disabled.
     */
    async toggleActivity(state: boolean): Promise<void> {
        this.lastActivity = Date.now();

        try {
            if (this.toggledActivity !== state) {
                await ConfigModel.updateOne({ guildId: this.guildId }, { enabled: state }, { upsert: true, new: true }).exec();
                this.toggledActivity = state;
            }

            return;
        } catch(e) {
            console.error("[Database]", `Failed to disable/enable the collection/sending in guild ${this.guildId}:\n`, e);

            throw e;
        }
    }

    /**
     * Adds a text to the database.
     * @param text The text.
     * @param author Text author.
     * @param id Message id.
     */
    async addText(text: string, author: string, id: string): Promise<void> {
        this.lastActivity = Date.now();

        try {
            await this.getTexts();

            const encryptedText = this.client.crypto.encrypt(text, author, id);

            await TextsModel.updateOne({ guildId: this.guildId }, {
                $push: { list: encryptedText },
                expiresAt: this.expiresTimestamp()
            }, { upsert: true, new: true }).exec();

            this.texts.push({ id, author, decrypted: text, encrypted: encryptedText });
            if (this.texts.length > this.textsLimit)
                await this.deleteFirstText(this.texts.length - this.textsLimit);

            this.markovChains.generateDictionary(this.texts.map((v) => v.decrypted));
        } catch(e) {
            console.error("[Database]", `Failed to add a text to database of guild ${this.guildId}:\n`, e);
        }
    }

    /**
     * Configures the channel.
     * @param channelId Channel id.
     */
    async configChannel(channelId: string): Promise<void> {
        this.lastActivity = Date.now();

        try {
            await ConfigModel.findOneAndUpdate({ guildId: this.guildId }, { channelId: channelId }, { upsert: true, new: true }).exec();

            this.channelId = channelId;
        } catch(e) {
            console.error("[Database]", `Failed to set the channel (${channelId}) of guild ${this.guildId}:\n`, e);

            throw e;
        }
    }

    /**
     * Gets the defined channel.
     * @returns Channel id.
     */
    async getChannel(): Promise<string> {
        this.lastActivity = Date.now();

        if (this.channelId) {
            return this.channelId;
        } else {
            try {
                let query = await ConfigModel.findOne({ guildId: this.guildId }, "channelId").exec();
                this.channelId = query?.channelId;
                
                return query?.channelId;
            } catch(e) {
                console.error("[Database]", `Failed to get the channel of guild ${this.guildId}:\n`, e);
            }
        }
    }

    /**
     * Configures the Webhook.
     * @param url Webhook URL.
     */
    async configWebhook(url?: string): Promise<void> {
        this.lastActivity = Date.now();

        try {
            await ConfigModel.updateOne({ guildId: this.guildId }, { webhook: url ?? null }, { upsert: true, new: true }).exec();

            this.webhook = url;
        } catch(e) {
            console.error("[Database]", `Failed to set the webhook of guild ${this.guildId}:\n`, e);

            throw e;
        }
    }

    /**
     * Gets the defined Webhook.
     * @returns Webhook.
     */
    async getWebhook(): Promise<string> {
        this.lastActivity = Date.now();

        if (this.webhook) {
            return this.webhook;
        } else {
            try {
                let query = await ConfigModel.findOne({ guildId: this.guildId }, "webhook").exec();
                this.webhook = query?.webhook;
                
                return query?.webhook;
            } catch(e) {
                console.error("[Database]", `Failed to get the webhook of guild ${this.guildId}:\n`, e);

                throw e;
            }
        }
    }

    /**
     * Configures the texts limit.
     * @param limit Limit.
     */
    async configTextsLimit(limit: number): Promise<void> {
        this.lastActivity = Date.now();

        try {
            await ConfigModel.updateOne({ guildId: this.guildId }, { textsLimit: limit }, { upsert: true, new: true }).exec();

            this.textsLimit = limit;

            if (limit < this.texts.length) {
                this.deleteFirstText(this.texts.length - limit);
            }
        } catch(e) {
            console.error("[Database]", `Failed to set the text limit of guild ${this.guildId}:\n`, e);

            throw e;
        }
    }

    /**
     * Gets the texts limit.
     * @returns Text limit.
     */
    async getTextsLimit(): Promise<number> {
        return new Promise(async (resolve) => {
            if (!this.loadedConfig) {
                this.once("ready", () => resolve(this.textsLimit));
            } else {
                resolve(this.textsLimit);
            }
        });
    }

    /**
     * Gets the amount of stored texts.
     * @returns Amount.
     */
    async getTextsLength(): Promise<number> {
        await this.getTexts();

        return this.texts.length;
    }

    /**
     * Deletes a specific stored text.
     * @param id Message id.
     */
    async deleteText(id: string): Promise<void> {
        const idx = this.texts.findIndex((v) => v.id == id);
        let info: DecryptedText;

        try {
            if (idx != -1) {
                info = this.texts[idx];
                if (!info?.encrypted || !info?.decrypted) return;

                this.texts.splice(idx, 1);
                this.markovChains.generateDictionary(this.texts.map((v) => v.decrypted));

                await TextsModel.updateOne({ guildId: this.guildId }, { $pull: { list: info.encrypted } }).exec();
            }
        } catch(e) {
            console.error("[Database]", `Failed to delete the text "${info?.encrypted}" of guild ${this.guildId}:\n`, e);
        }
    }

    /**
     * Deletes the first stored texts.
     * @param range Range from the beginning.
     */
    async deleteFirstText(range: number = 1): Promise<void> {
        this.lastActivity = Date.now();

        try {
            await this.getTexts();

            let update: object = { $pop: { list: -1 } };
            if (range > 1) {
                update = { $push: { list: { $each: [], $slice: -Math.abs(this.texts.length - range) } } };
            }

            await TextsModel.updateOne({ guildId: this.guildId }, update).exec();

            for (let i=0; i < range; i++) {
                this.texts.shift();
            }

            this.markovChains.generateDictionary(this.texts.map((v) => v.decrypted));
        } catch(e) {
            console.error("[Database]", `Failed to delete the first texts (range: ${range}) of guild ${this.guildId}:\n`, e);
        }
    }

    /**
     * Deletes all the texts stored.
     */
    async deleteAllTexts(): Promise<void> {
        this.lastActivity = Date.now();

        try {
            await TextsModel.deleteOne({ guildId: this.guildId }).exec();

            this.texts = [];
            this.markovChains.generateDictionary([]);

            return;
        } catch(e) {
            console.error("[Database]", `Failed to delete all texts of guild ${this.guildId}:\n`, e);
            
            throw e;
        }
    }

    /**
     * Deletes all specific user stored texts.
     * @param user User id.
     */
    async deleteUserTexts(user: string): Promise<void> {
        await this.getTexts();

        let userTexts = this.texts.filter(v => v.author == user).map(v => v.decrypted);
        if (userTexts.length < 1) return;

        try {
            let query = await TextsModel.updateOne({ guildId: this.guildId },
                {
                    $pull: {
                        list: {
                            $regex: `^[0-9a-z+/=]+:[0-9a-z+/=]+:${user}`,
                            $options: "i"
                        }
                    }
                }
            ).exec();

            if (query.modifiedCount < 1)
                throw new Error("Modified count equals to 0");

            userTexts.forEach((v) => {
                let i = this.texts.findIndex((_v) => v == _v.decrypted);
                if (i >= 0) this.texts.splice(i, 1);
            });

            this.markovChains.generateDictionary(this.texts.map((v) => v.decrypted));

            return;
        } catch(e) {
            console.error("[Database]", `Failed to delete all texts of user ${user}:\n`, e);
            
            throw e;
        }
    }

    /**
     * Edits a stored text.
     * @param id Message id.
     * @param text New text.
     */
    async updateText(id: string, text: string) {
        const idx = this.texts.findIndex((v) => v.id == id);
        let info: DecryptedText;

        try {
            if (idx != -1) {
                info = this.texts[idx];
                if (!info) return;

                const encryptedText = this.client.crypto.encrypt(text, info.author, id);

                await TextsModel.updateOne(
                    { guildId: this.guildId },
                    { $set: { "list.$[element]": encryptedText } },
                    { arrayFilters: [ { element: info.encrypted } ] }
                ).exec();

                info.decrypted = text;
                info.encrypted = encryptedText;
                this.markovChains.generateDictionary(this.texts.map((v) => v.decrypted));
            }
        } catch(e) {
            console.error("[Database]", `Failed to update the text "${info?.encrypted}" of guild ${this.guildId}:\n`, e);
        }
    }

    /**
     * Delete the guild database.
     */
    async deleteDatabase(): Promise<void> {
        this.lastActivity = Date.now();

        try {
            await ConfigModel.deleteOne({ guildId: this.guildId }).exec();
            await TextsModel.deleteOne({ guildId: this.guildId }).exec();

            this.toggledActivity = false;
            this.markovChains = null;
            this.channelId = null;
            this.webhook = null;
            this.textsLimit = 500;
            this.texts = [];
        } catch(e) {
            console.error("[Database]", `Failed to delete the database of guild ${this.guildId}:\n`, e);
        }
    }

    /**
     * Defines the chance to collect messages.
     * @param percentage Float percentage (`p / 100`).
     */
    async setCollectionPercentage(percentage: number): Promise<void> {
        try {
            await ConfigModel.findOneAndUpdate({ guildId: this.guildId }, { collectPercentage: percentage }, { upsert: true, new: true }).exec();
            this.collectPercentage = percentage;
        } catch(e) {
            console.error("[Database]", `Failed to set the collection percentage of guild ${this.guildId}:\n`, e);

            throw e;
        }
    }

    /**
     * Defines the chance to send messages.
     * @param percentage Float percentage (`p / 100`).
     */
    async setSendingPercentage(percentage: number): Promise<void> {
        try {
            await ConfigModel.findOneAndUpdate({ guildId: this.guildId }, { sendingPercentage: percentage }, { upsert: true, new: true }).exec();
            this.sendingPercentage = percentage;
        } catch(e) {
            console.error("[Database]", `Failed to set the sending percentage of guild ${this.guildId}:\n`, e);

            throw e;
        }
    }
    /**
     * Defines the chance to reply messages.
     * @param percentage Float percentage (`p / 100`).
     */
    async setReplyPercentage(percentage: number): Promise<void> {
        try {
            await ConfigModel.findOneAndUpdate({ guildId: this.guildId }, { replyPercentage: percentage }, { upsert: true, new: true }).exec();
            this.replyPercentage = percentage;
        } catch(e) {
            console.error("[Database]", `Failed to set the reply percentage of guild ${this.guildId}:\n`, e);

            throw e;
        }
    }

    /**
     * Gets the chance to collect messages.
     * @returns Float percentage (`p / 100`);
     */
    async getCollectionPercentage(): Promise<number> {
        try {
            if (!this.collectPercentage) {
                let percentage = 0.25;
                let query = await ConfigModel.findOne({ guildId: this.guildId }, "collectPercentage").exec();
                if (query?.collectPercentage) {
                    percentage = query.collectPercentage;
                    this.collectPercentage = percentage;
                }

                return percentage;
            } else {
                return this.collectPercentage;
            }
        } catch(e) {
            console.error("[Database]", `Failed to get the collection percentage of guild ${this.guildId}:\n`, e);

            return 0.25;
        }
    }

    /**
     * Gets the chance to send messages.
     * @returns Float percentage (`p / 100`);
     */
    async getSendingPercentage(): Promise<number> {
        try {
            if (!this.sendingPercentage) {
                let percentage = 0.10;
                let query = await ConfigModel.findOne({ guildId: this.guildId }, "sendingPercentage").exec();
                if (query?.sendingPercentage) {
                    percentage = query.sendingPercentage;
                    this.sendingPercentage = query.sendingPercentage;
                }

                return percentage;
            } else {
                return this.sendingPercentage;
            }
        } catch(e) {
            console.error("[Database]", `Failed to get the sending percentage of guild ${this.guildId}:\n`, e);

            return 0.10;
        }
    }

    /**
     * Gets the chance to reply messages.
     * @returns Float percentage (`p / 100`);
     */
    async getReplyPercentage(): Promise<number> {
        try {
            if (!this.replyPercentage) {
                let percentage = 0.25;
                let query = await ConfigModel.findOne({ guildId: this.guildId }, "replyPercentage").exec();
                if (query?.replyPercentage) {
                    percentage = query.replyPercentage;
                    this.replyPercentage = query.replyPercentage;
                }

                return percentage;
            } else {
                return this.replyPercentage;
            }
        } catch(e) {
            console.error("[Database]", `Failed to get the reply percentage of guild ${this.guildId}:\n`, e);

            return 0.25;
        }
    }

    /**
     * Loads the texts from the database.
     * @returns The decrypted texts.
     */
    async getTexts(): Promise<DecryptedText[]> {
        this.lastActivity = Date.now();

        if (!this.loadedTexts) {
            try {
                let query = await TextsModel.findOne({ guildId: this.guildId }).exec();

                if (query?.list) {
                    this.texts = await Promise.all(query.list.map(v => this.client.crypto.decrypt(v)));
                    this.markovChains.generateDictionary(this.texts.map((v) => v.decrypted));
                    this.loadedTexts = true;

                    return this.texts;
                }

                return [];
            } catch(e) {
                console.error("[Database]", `Failed to get the texts of guild ${this.guildId}:\n`, e);
            }
        } else {
            return this.texts;
        }
    }

    /**
     * Initializes the guild database.
     */
    private async init(): Promise<void> {
        try {
            const config = await ConfigModel.findOne({ guildId: this.guildId }).exec();
            
            this.channelId = config?.channelId;
            this.toggledActivity = config?.enabled;
            this.textsLimit = config?.textsLimit ?? this.textsLimit;
            this.loadedConfig = true;
            this.emit("ready");
        } catch(e) {
            // Try again
            this.init();
        }
    }

    /**
     * Defines the data expiration time.
     * @returns Expiration timestamp.
     */
    private expiresTimestamp(): number {
        return Date.now() + (30 * 1000 * 60 * 60 * 24);
    }
}