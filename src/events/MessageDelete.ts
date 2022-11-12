import Event from "../structures/Event";

import { Message } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class MessageDelete extends Event {
    constructor() {
        super("messageDelete");
    }

    async run(client: ClientInterface, message: Message): Promise<void> {
        if (
            message.author.bot ||
            !message.content ||
            message.content.trim().length < 1 ||
            message.channel.type != "GUILD_TEXT" ||
            await client.database.isBanned(message.guildId)
        ) return;

        const database = await client.database.fetch(message.guildId);
        if (!database.toggledActivity) return;

        const channelId = await database.getChannel();
        if (message.channelId != channelId) return;

        database.deleteText(message.author.id, message.content);
    }
}