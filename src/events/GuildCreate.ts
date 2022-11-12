import { MessageEmbed, MessageActionRow, MessageButton, WebhookClient } from "discord.js";
import Event from "../structures/Event";

import { Guild } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

interface deleteCommandOptions {
    name: string;
    options: {
        name: string
    }[];
};

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

            const configName = t("commands.config.command.name", lng);
            const channelName = t("commands.channel.command.name", lng);
            const enableName = t("commands.enable.command.name", lng);
            const infoName = t("commands.info.command.name", lng);
            const deleteCommand: deleteCommandOptions = t("commands.deleteTexts.command", { ...lng, returnObjects: true });
        
            try {
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton({
                            emoji: "💡",
                            label: t("vars.gettingStarted", lng),
                            url: "https://knwbot.gitbook.io/markov-bot/",
                            style: "LINK"
                        }),
                        new MessageButton({
                            emoji: "📜",
                            label: t("vars.tos", lng),
                            url: "https://knwbot.gitbook.io/markov-bot/terms/terms-of-service",
                            style: "LINK"
                        }),
                        new MessageButton({
                            emoji: "🔒",
                            label: t("vars.privacyPolicy", lng),
                            url: "https://knwbot.gitbook.io/markov-bot/terms/privacy-policy",
                            style: "LINK"
                        })
                    );

                await guild.systemChannel.send({
                    content: t("events.welcome", {
                        ...lng,
                        channelCommand: `/${configName} ${channelName}`,
                        enableCommand: `/${configName} ${enableName}`,
                        infoCommand: `/${infoName}`,
                        deleteCommand: `/${deleteCommand.name}`,
                        member: deleteCommand.options[0].name,
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
                .setThumbnail(guild.iconURL())
                .setColor(0x32d35b)
                .setDescription(description)
                .setTimestamp();

            return this.webhook.send({ embeds: [ embed ] })
                .catch(e => console.error("[Webhook Log]", e));
        }
    }
}