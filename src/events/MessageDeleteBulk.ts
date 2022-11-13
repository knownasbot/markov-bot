import Event from "../structures/Event";

import ClientInterface from "../interfaces/ClientInterface";

interface Messages {
    ids: string[];
    channel_id: string;
    guild_id: string;
};

export default class MessageDeleteBulk extends Event {
    public ws: boolean = true;

    constructor() {
        super("MESSAGE_DELETE_BULK");
    }

    async run(client: ClientInterface, messages: Messages): Promise<void> {
        if (
            await client.database.isBanned(messages.guild_id)
        ) return;

        const database = await client.database.fetch(messages.guild_id);
        if (!database.toggledActivity) return;

        const channelId = await database.getChannel();
        if (messages.channel_id != channelId) return;

        for (let id of messages.ids) {
            database.deleteText(id);
        }
    }
}