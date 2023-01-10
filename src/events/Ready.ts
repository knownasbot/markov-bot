import Event from "../structures/Event";
import CommandHandler from "../handlers/CommandHandler";
import * as status from "./status.json";

import { ActivitiesOptions } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class Ready extends Event {
    private randomTexts: (string | ActivitiesOptions)[] = status as (string | ActivitiesOptions)[];

    constructor() {
        super("ready");
    }

    run(client: ClientInterface): void {
        new CommandHandler(client);

        if (process.env.TOPGG_TOKEN) {
            this.randomTexts.push("vote me on top.gg 🥺");
        }

        client.user.setPresence({ activities: [ this.getRandomText() ] });
        setInterval(() => {
            client.user.setPresence({ activities: [ this.getRandomText() ] });
        }, 60 * 60 * 1000);
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
}