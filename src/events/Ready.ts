import BaseEvent from "./BaseEvent";
import CommandHandler from "../handlers/CommandHandler";
import TextsModel from "../modules/database/models/TextsModel";
import * as status from "./status.json";

import { ActivitiesOptions } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class Ready extends BaseEvent {
    private randomTexts: (string | ActivitiesOptions)[] = status as (string | ActivitiesOptions)[];

    constructor() {
        super("ready");
    }

    run(client: ClientInterface): void {
        console.log("[Bot]", `Connected to the Discord.`);

        new CommandHandler(client);

        // Random activity
        if (process.env.TOPGG_TOKEN) {
            this.randomTexts.push("vote me on top.gg 🥺");
        }

        client.user.setPresence({ activities: [ this.getRandomText() ] });
        setInterval(() => {
            client.user.setPresence({ activities: [ this.getRandomText() ] });
        }, 60*60*1000);

        setInterval(() => this.deleteInactiveTexts(), 24 * 1000 * 60 * 60);
    }

    /**
     * Returns a random text for bot's activity status.
     * @returns {string} Text
     */
    private getRandomText(): ActivitiesOptions {
        const randomPresence = this.randomTexts[Math.floor(Math.random() * this.randomTexts.length)];
        if (typeof randomPresence == "string") {
            return { type: "PLAYING", name: randomPresence };
        }

        return randomPresence;
    }

    /**
     * It deletes texts documents with old activity.
     */
    private async deleteInactiveTexts(): Promise<void> {
        try {
            await TextsModel.deleteMany({ expiresAt: { $lte: Date.now() } }).exec();
        } catch(e) {
            console.error("[Database]", "Failed to delete inactive texts:\n", e);
        }
    }
}