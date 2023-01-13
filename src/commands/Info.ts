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
        await interaction.deferReply();

        const lng = { lng: interaction.locale };
        const locUndefined = this.t("vars.undefined", lng);

        const database = await this.client.database.fetch(interaction.guildId);
        const isBanned = await this.client.database.isBanned(interaction.guildId);
        const isTracking = await this.client.database.isTrackAllowed(interaction.user.id);
        const serverCount = (await this.client.shard.fetchClientValues("guilds.cache.size") as number[])
            .reduce((a, b) => a + b);

        // Basic info
        let description = this.t("commands.info.texts.online", { ...lng, time: `<t:${Math.floor(this.client.readyTimestamp / 1000)}:R>` }) + "\n";
        description    += this.t("commands.info.texts.serverSize", { ...lng, size: serverCount }) + "\n";
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
            serverInfo += this.t("commands.info.texts.sendingChance", { ...lng, chance: `${await database.getSendingPercentage() * 100}%` }) + "\n";
            serverInfo += this.t("commands.info.texts.replyChance", { ...lng, chance: `${await database.getReplyPercentage() * 100}%` });
        }

        // Software
        let softwareInfo = this.t("commands.info.texts.nodeVersion", { ...lng, version: process.version }) + "\n";
        softwareInfo += this.t("commands.info.texts.djsVersion", { ...lng, version: "v" + version }) + "\n";
        softwareInfo += this.t("commands.info.texts.memUsage", { ...lng, mem: `${Math.floor(process.memoryUsage().heapUsed / 1024 ** 2)} mb` }) + "\n";
        softwareInfo += this.t("commands.info.texts.developer", { ...lng, dev: `${this.client.config.emojis.twitter} [@knownasbot](https://twitter.com/knownasbot)` });

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
                    emoji: this.client.config.emojis.topgg,
                    label: "Top.gg",
                    url: this.client.config.links.topgg,
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
                    emoji: "👥",
                    label: this.t("vars.support", lng),
                    url: this.client.config.links.support,
                    style: "LINK"
                }),
                new MessageButton({
                    emoji: this.client.config.emojis.github,
                    label: "GitHub",
                    url: this.client.config.links.github,
                    style: "LINK"
                }),
                new MessageButton({
                    emoji: "📜",
                    label: this.t("vars.tos", lng),
                    url: this.client.config.links.tos,
                    style: "LINK"
                }),
                new MessageButton({
                    emoji: "🔒",
                    label: this.t("vars.privacyPolicy", lng),
                    url: this.client.config.links.privacy,
                    style: "LINK"
                })
            );

        embed.setFooter({
            text: `Shard ${interaction.guild.shardId}`
        });

        return interaction.editReply({ embeds: [ embed ], components: [ cRow, docsRow ] });
    }
}