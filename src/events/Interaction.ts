import { MessageEmbed } from "discord.js";
import Event from "../structures/Event";

import { CommandInteraction, ButtonInteraction } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";
import CommandInterface from "../interfaces/CommandInterface";

interface FAQ {
    title: string;
    description: string;
    fields: {
        name: string;
        value: string;
    }[]
};

export default class Interaction extends Event {
    private pleadingGIFs = [
        "https://c.tenor.com/F7ypx136ZigAAAAd/cat-cute.gif",
        "https://c.tenor.com/RGzSEnABvDoAAAAC/mad-angry.gif",
        "https://c.tenor.com/8EcxOsjmoFcAAAAC/begging-dog.gif",
        "https://c.tenor.com/bmtLf8P0Xi8AAAAC/pleading-creepy.gif",
        "https://c.tenor.com/EQrH6C_FOy4AAAAd/cries-about-it-cry-about-it.gif"
    ];

    constructor() {
        super("interactionCreate");
    }

    async run(client: ClientInterface, interaction: CommandInteraction | ButtonInteraction): Promise<void> {
        const lng = { lng: interaction.locale };
        const { t } = client.i18n;

        if (interaction.isCommand()) {
            const command: CommandInterface = client.commands.get(interaction.commandName);
            if (command) {
                if (command.permissions && !interaction.memberPermissions.has(command.permissions)) {
                    return interaction.reply({ content: t("commands.config.error", { lng: interaction.locale }), ephemeral: true });
                }

                try {
                    if (!command.skipBan) {
                        const isBanned = await client.database.isBanned(interaction.guildId);
                        if (isBanned) {
                            return interaction.reply({ content: t("commands.ban.texts.error", { lng: interaction.locale, reason: isBanned }), ephemeral: true });
                        }
                    }

                    if (command.dev && !client.config.admins.includes(interaction.user.id)) {
                        return interaction.reply({ content: "You aren't allowed to execute this command.", ephemeral: true });
                    }

                    await command.run(interaction);
                } catch (e) {
                    try {
                        await interaction.reply({ content: t("vars.error", { lng: interaction.locale }), ephemeral: true });
                    } catch {};

                    console.log("[Commands]", `Failed to execute the command "${interaction.commandName}": `, e);
                }
            }
        } else if (interaction.isButton()) {
            let embed: MessageEmbed;
            if (interaction.customId == "donate") {
                embed = new MessageEmbed({
                    color: 0x34eb71,
                    title: "💸 " + t("commands.donate.title", { ...lng }),
                    description: t("commands.donate.description", {
                        ...lng,
                        urls: `${client.config.emojis.bmc} **Buy Me A Coffee: [buymeacoffee.com/knownasbot](${client.config.links.bmc})**`,
                        friendURL: `**${client.config.emojis.twitter} [@LukeFl_](https://twitter.com/lukefl_)**`
                    }),
                    fields: [
                        {
                            name: t("commands.donate.cryptoTitle", { ...lng }),
                            value: `**${client.config.emojis.bitcoin} Bitcoin:** \`${client.config.cryptoAddresses.bitcoin}\`\n**${client.config.emojis.ethereum} Ethereum:** \`${client.config.cryptoAddresses.ethereum}\``
                        }
                    ],
                    image: {
                        url: this.pleadingGIFs[Math.floor(Math.random() * this.pleadingGIFs.length)]
                    },
                    footer: {
                        text: t("commands.donate.footer", lng)
                    }
                });
            } else if (interaction.customId == "faq") {
                const translation: FAQ = t("events.faq", {
                    ...lng,
                    returnObjects: true,

                    contact: `**${client.config.emojis.twitter} [@knownasbot](https://twitter.com/knownasbot)**`,
                    friendURL: "https://twitter.com/lukefl_",
                    deleteCommand: "/" + t("commands.deleteTexts.command.name", lng),
                    trackingCommand: "/" + t("commands.tracking.command.name", lng),
                    parameter: t("commands.deleteTexts.command.options.0.name", lng)
                });

                embed = new MessageEmbed({
                    title: "❔ " + translation.title,
                    description: translation.description,
                    fields: translation.fields
                });
            }

            if (embed) {
                return interaction.reply({ embeds: [ embed ], ephemeral: true });
            }
        }
    }
}