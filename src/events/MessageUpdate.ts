import Event from "../structures/Event";

import ClientInterface from "../interfaces/ClientInterface";

interface Message {
    id: string;
    content: string;
    channel_id: string;
    guild_id: string;
};

export default class MessageUpdate extends Event {
    public ws: boolean = true;

    constructor() {
        super("MESSAGE_UPDATE");
    }

    async run(client: ClientInterface, message: Message): Promise<void> {
        if (
            await client.database.isBanned(message.guild_id)
        ) return;

        const database = await client.database.fetch(message.guild_id);
        if (!database.toggledActivity) return;

        const channelId = await database.getChannel();
        if (message.channel_id != channelId) return;

        database.updateText(message.id, message.content);
    }
}