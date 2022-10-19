import BaseEvent from "./BaseEvent";

import { Message, Collection } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class MessageDeleteBulk extends BaseEvent {
    constructor() {
        super("messageDeleteBulk");
    }

    async run(client: ClientInterface, messages: Collection<string, Message>): Promise<void> {
        const firstMessage = messages.first();

        if (
            firstMessage.channel.type != "GUILD_TEXT" ||
            await client.database.isBanned(firstMessage.guildId)
        ) return;

        const database = await client.database.fetch(firstMessage.guildId);
        if (!database.toggledActivity) return;

        const channelId = await database.getChannel();
        if (firstMessage.channelId != channelId) return;

        messages.forEach((message) => {
            if (
                message.author.bot ||
                !message.content ||
                message.content.trim().length < 1
            ) return;

            database.deleteText(message.author.id, message.content);
        });
    }
}