import { EventEmitter } from "events";
import ConfigModel from "./models/ConfigModel";
import TextsModel from "./models/TextsModel";
import MarkovChains from "../markov/MarkovChains";

import ClientInterface from "../../interfaces/ClientInterface";

interface GuildDatabaseInterface {
    once(event: "ready", listener: Function): this;
}

interface DecryptedText {
    author?: string;
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
    public textsInfo: DecryptedText[] = [];
    public collectPercentage: number;
    public sendingPercentage: number;

    private client: ClientInterface;
    private loadedConfig: boolean = false;
    private loadedTexts: boolean = false;
    private guildId: string;
    private texts: string[] = [];

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
     */
    async addText(text: string, author: string): Promise<void> {
        this.lastActivity = Date.now();

        try {
            if (!this.loadedTexts) {
                await this.loadTexts();
            }

            const encryptedText = this.client.crypto.encrypt(text, author);

            await TextsModel.updateOne({ guildId: this.guildId }, {
                $push: { list: encryptedText },
                expiresAt: this.expiresTimestamp()
            }, { upsert: true, new: true }).exec();

            this.texts.push(text);
            this.textsInfo.push({ author, decrypted: text, encrypted: encryptedText });

            if (this.texts.length > this.textsLimit)
                await this.deleteFirstText(this.texts.length - this.textsLimit);

            this.markovChains.generateDictionary(this.texts);
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
        if (!this.loadedTexts) {
            await this.loadTexts();
        }

        return this.texts.length;
    }

    /**
     * Deletes a specific stored text.
     * @param author Text author.
     * @param text Text.
     */
    async deleteText(author: string, text: string): Promise<void> {
        const idx = this.textsInfo.findIndex((v) => v.author == author && v.decrypted == text);
        let info: DecryptedText;

        try {
            if (idx != -1) {
                info = JSON.parse(JSON.stringify(this.textsInfo[idx])); // Remove the memory reference
                if (!info?.encrypted || !info?.decrypted) return;

                this.textsInfo.splice(idx, 1);
                this.texts = this.textsInfo.map((v) => v.decrypted);
                this.markovChains.generateDictionary(this.texts);

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
            if (!this.loadedTexts) {
                await this.loadTexts();
            }

            let update: object = { $pop: { list: -1 } };
            if (range > 1) {
                update = { $push: { list: { $each: [], $slice: -Math.abs(this.texts.length - range) } } };
            }

            await TextsModel.updateOne({ guildId: this.guildId }, update).exec();

            for (let i=0; i < range; i++) {
                this.texts.shift();
                this.textsInfo.shift();
            }

            this.markovChains.generateDictionary(this.texts);
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
        if (!this.loadedTexts) {
            await this.loadTexts();
        }

        let userTexts = this.textsInfo.filter(v => v.author == user).map(v => v.decrypted);
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
                let i = this.texts.findIndex((_v) => v == _v);
                let i2 = this.textsInfo.findIndex((_v) => v == _v.decrypted);

                if (i >= 0) this.texts.splice(i, 1);
                if (i2 >= 0) this.textsInfo.splice(i2, 1);
            });

            this.markovChains.generateDictionary(this.texts);

            return;
        } catch(e) {
            console.error("[Database]", `Failed to delete all texts of user ${user}:\n`, e);
            
            throw e;
        }
    }

    /**
     * Edits a stored text.
     * @param author Text author.
     * @param text Text.
     * @param update New text.
     */
    async updateText(author: string, text: string, update: string) {
        const idx = this.textsInfo.findIndex((v) => v.author == author && v.decrypted == text);
        let info: DecryptedText;

        try {
            if (idx != -1) {
                const encryptedText = this.client.crypto.encrypt(update, author);

                info = this.textsInfo[idx];

                await TextsModel.updateOne(
                    { guildId: this.guildId },
                    { $set: { "list.$[element]": encryptedText } },
                    { arrayFilters: [ { element: info.encrypted } ] }
                ).exec();

                info.decrypted = update;
                info.encrypted = encryptedText;
                this.texts = this.textsInfo.map((v) => v.decrypted);
                this.markovChains.generateDictionary(this.texts);
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
            this.textsInfo = [];
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
     * Loads the texts from the database.
     */
    async loadTexts(): Promise<void> {
        try {
            if (this.texts.length < 1) {
                const texts = await this.getTexts();
                texts.forEach(v => {
                    this.texts.push(v.decrypted);
                    this.textsInfo.push(v);
                });

                this.markovChains.generateDictionary(this.texts);
                this.loadedTexts = true;
            }
        } catch(e) {
            console.error("[Database]", `Failed to load the texts of guild ${this.guildId}:\n`, e);
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
     * Gets the texts from the database and decrypts it.
     * @returns Decrypted texts.
     */
    private async getTexts(): Promise<DecryptedText[]> {
        this.lastActivity = Date.now();

        try {
            let query = await TextsModel.findOne({ guildId: this.guildId }).exec();

            if (query?.list) {
                return await Promise.all(query.list.map(v => this.client.crypto.decrypt(v)));
            }

            return [];
        } catch(e) {
            console.error("[Database]", `Failed to get the texts of guild ${this.guildId}:\m`, e);
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