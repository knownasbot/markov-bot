import BaseEvent from "./BaseEvent";

import { Message } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class MessageUpdate extends BaseEvent {
    constructor() {
        super("messageUpdate");
    }

    async run(client: ClientInterface, oldMessage: Message, message: Message): Promise<void> {
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

        database.updateText(message.author.id, oldMessage.content, message.content);
    }
}