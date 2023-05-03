import { MessageEmbed, MessageActionRow, MessageButton, WebhookClient } from "discord.js";
import Event from "../structures/Event";

import { Guild } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class GuildCreate extends Event {
    private webhook: WebhookClient;

    constructor() {
        super("guildCreate");

        if (process.env.SERVER_LOG) {
            this.webhook = new WebhookClient({ url: process.env.SERVER_LOG });
        }
    }

    async run(client: ClientInterface, guild: Guild): Promise<any> {
        if (guild.systemChannel) {
            const { t } = client.i18n;
            const lng = { lng: guild.preferredLocale };

            const infoCommandName = t("commands.info.command.name");
            const configCommandName = t("commands.config.command.name");
            const enableCommandName = t("commands.enable.command.name");
            const channelCommandName = t("commands.channel.command.name");
            const deleteCommandName = t("commands.deleteTexts.command.name");
        
            const commands = await client.application.commands.fetch();
            const infoCommand = commands.find((v) => v.name == infoCommandName);
            const configCommand = commands.find((v) => v.name == configCommandName);
            const deleteCommand = commands.find((v) => v.name == deleteCommandName);

            try {
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton({
                            emoji: "💡",
                            label: t("vars.gettingStarted", lng),
                            url: client.config.links.website,
                            style: "LINK"
                        }),
                        new MessageButton({
                            emoji: "📜",
                            label: t("vars.tos", lng),
                            url: client.config.links.tos,
                            style: "LINK"
                        }),
                        new MessageButton({
                            emoji: "🔒",
                            label: t("vars.privacyPolicy", lng),
                            url: client.config.links.privacy,
                            style: "LINK"
                        })
                    );

                await guild.systemChannel.send({
                    content: t("events.welcome", {
                        ...lng,
                        infoCommand: `</${infoCommandName}:${infoCommand.id}>`,
                        channelCommand: `</${configCommandName} ${channelCommandName}:${configCommand.id}>`,
                        enableCommand: `</${configCommandName} ${enableCommandName}:${configCommand.id}>`,
                        deleteCommand: `</${deleteCommandName}:${deleteCommand.id}>`,
                        min: 5
                    }),
                    components: [ row ]
                });
            } catch {}; // Probably has no permission
        }

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
                .setColor(0x32d35b)
                .setDescription(description)
                .setFooter({ text: "Shard " + guild.shardId })
                .setTimestamp();

            return this.webhook.send({ embeds: [ embed ] })
                .catch(e => console.error("[Webhook Log]", e));
        }
    }
}