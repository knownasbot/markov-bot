import { MessageEmbed, WebhookClient } from "discord.js";
import Event from "../structures/Event";

import { Guild } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class GuildDelete extends Event {
    private webhook: WebhookClient;

    constructor() {
        super("guildDelete");

        if (process.env.SERVER_LOG) {
            this.webhook = new WebhookClient({ url: process.env.SERVER_LOG });
        }
    }

    async run(client: ClientInterface, guild: Guild): Promise<any> {
        // Outage
        if (!guild.available) return;

        client.database.delete(guild.id);
        client.cooldown.delete(guild.id);
        
        if (this.webhook) {
            let ownerTag;
            try {
                ownerTag = (await client.users.fetch(guild.ownerId))?.tag
            } catch {};

            let description = `ID: \`${guild?.id}\`.\n`;
            description    += `Owner: \`${ownerTag ?? "Unknown"}\` (\`${guild?.ownerId ?? "Unknown"}\`).\n`;
            description    += `Member count: \`${guild?.memberCount ?? "Unknown"}\`.\n`;

            const embed = new MessageEmbed()
                .setTitle(guild?.name ?? "Unknown")
                .setThumbnail(guild.iconURL())
                .setColor(0xd33235)
                .setDescription(description)
                .setTimestamp();

            return this.webhook.send({ embeds: [ embed ] })
                .catch(e => console.error("[Webhook Log]", e));
        }
    }
}