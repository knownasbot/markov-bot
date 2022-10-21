import axios from "axios";
import { MessageEmbed, MessageActionRow, MessageButton, version } from "discord.js";
import Command from "../structures/Command";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class InfoCommand extends Command {
    public skipBan: boolean = true;

    constructor(client: ClientInterface) {
        super(
            client,
            "info",
            "commands.info.command.description"
        );
    }

    async run(interaction: CommandInteraction) {
        if (interaction.channel.type != "GUILD_TEXT") return;

        await interaction.deferReply();

        const lng = { lng: interaction.locale };
        const locUndefined = this.t("vars.undefined", lng);

        const database = await this.client.database.fetch(interaction.guildId);
        const isBanned = await this.client.database.isBanned(interaction.guildId);
        const isTracking = await this.client.database.isTrackAllowed(interaction.user.id);

        // Basic info
        let description = this.t("commands.info.texts.online", { ...lng, time: `<t:${Math.floor(this.client.readyTimestamp / 1000)}:R>` }) + "\n";
        description    += this.t("commands.info.texts.serverSize", { ...lng, size: this.client.guilds.cache.size }) + "\n";
        description    += this.t("commands.info.texts.tracking", {
            ...lng,
            state: isTracking ? this.t("vars.enabled", lng) : this.t("vars.disabled", lng)
        });

        const embed = new MessageEmbed()
            .setTitle("👽 " + this.t("commands.info.texts.title", lng))
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setDescription(description);

        // Server related info
        const channelId = await database.getChannel();

        let webhook = await database.getWebhook();
        let webhookName;
        if (webhook) {
            try {
                let res = await axios.get(webhook);
                if (res.status == 200) {
                    webhookName = res.data.name;
                } else {
                    webhook = null;
                }
            } catch (e) {
                if (e.response.status != 404) {
                    console.error("[Commands]", "Failed to get Webhook info:\n", e);
                } else {
                    webhook = null;
                    await database.configWebhook();
                }
            }
        }

        const channel = await interaction.guild.channels.fetch(channelId);
        const messagePermission = (
            channel?.permissionsFor &&
            channel.permissionsFor(interaction.guild.me)?.has("SEND_MESSAGES") &&
            channel.permissionsFor(interaction.guild.me)?.has("VIEW_CHANNEL")
        );

        let serverInfo;
        if (isBanned) {
            serverInfo = this.t("commands.info.texts.banned", { ...lng, reason: isBanned });
        } else {
            serverInfo = this.t("commands.info.texts.state", {
                ...lng,
                state: database.toggledActivity ? this.t("vars.enabled", lng) : this.t("vars.disabled", lng)
            }) + "\n";
            serverInfo += this.t("commands.info.texts.channel", {
                ...lng,
                channel: channelId ? `<#${channelId}>` : `\`${locUndefined}\``,
                permission: channelId && !messagePermission ? ` (${this.t("commands.info.texts.nopermission", lng)})` : ""
            }) + "\n";
            serverInfo += this.t("commands.info.texts.webhook", {
                ...lng,
                webhook: webhookName?.replace(/[`*\\]+/g, "") ?? locUndefined
            }) + "\n";
            serverInfo += this.t("commands.info.texts.textsLength", { ...lng, length: await database.getTextsLength() }) + "\n";
            serverInfo += this.t("commands.info.texts.textsLimit", { ...lng, limit: await database.getTextsLimit() }) + "\n";
            serverInfo += this.t("commands.info.texts.collectChance", { ...lng, chance: `${await database.getCollectionPercentage() * 100}%` }) + "\n";
            serverInfo += this.t("commands.info.texts.sendingChance", { ...lng, chance: `${await database.getSendingPercentage() * 100}%` });
        }

        // Software
        let softwareInfo = this.t("commands.info.texts.nodeVersion", { ...lng, version: process.version }) + "\n";
        softwareInfo += this.t("commands.info.texts.djsVersion", { ...lng, version: "v" + version }) + "\n";
        softwareInfo += this.t("commands.info.texts.memUsage", { ...lng, mem: `${Math.floor(process.memoryUsage().heapUsed / 1024 ** 2)} mb` }) + "\n";
        softwareInfo += this.t("commands.info.texts.developer", { ...lng, dev: "<:twitter:960204380563460227> [@knownasbot](https://twitter.com/knownasbot)" });

        embed.addFields(
            {
                name: this.t("commands.info.texts.serverField", lng),
                value: serverInfo
            },
            {
                name: this.t("commands.info.texts.softwareField", lng),
                value: softwareInfo
            }
        );

        const cRow = new MessageActionRow()
            .addComponents(
                new MessageButton({
                    emoji: "<:topgg:1016432122124320818>",
                    label: "Top.gg",
                    url: "https://top.gg/bot/903354338565570661",
                    style: "LINK"
                }),
                new MessageButton({
                    customId: "donate",
                    emoji: "🤑",
                    label: this.t("commands.info.texts.donate", lng),
                    style: "SECONDARY"
                }),
                new MessageButton({
                    customId: "faq",
                    emoji: "🤔",
                    label: this.t("commands.info.texts.faq", lng),
                    style: "SECONDARY"
                }),
                new MessageButton({
                    emoji: "😺",
                    label: this.t("commands.info.texts.cutecats", lng),
                    url: "https://youtu.be/dQw4w9WgXcQ",
                    style: "LINK"
                })
            );

        const docsRow = new MessageActionRow()
            .addComponents(
                new MessageButton({
                    emoji: "<:github:1033081923125391442>",
                    label: "GitHub",
                    url: "https://github.com/knownasbot/markov-bot",
                    style: "LINK"
                }),
                new MessageButton({
                    emoji: "📜",
                    label: this.t("vars.tos", lng),
                    url: "https://knwbot.gitbook.io/markov-bot/terms/terms-of-service",
                    style: "LINK"
                }),
                new MessageButton({
                    emoji: "🔒",
                    label: this.t("vars.privacyPolicy", lng),
                    url: "https://knwbot.gitbook.io/markov-bot/terms/privacy-policy",
                    style: "LINK"
                })
            );

        return interaction.editReply({ embeds: [ embed ], components: [ cRow, docsRow ] });
    }
}