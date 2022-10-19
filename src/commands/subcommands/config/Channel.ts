import SubCommand from "../../../structures/SubCommand";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../../../interfaces/ClientInterface";

export default class ChannelSubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.channel.command.name",
            "commands.channel.command.description",
            [
                {
                    type: "CHANNEL",
                    name: "commands.channel.command.options.0.name",
                    description: "commands.channel.command.options.0.description",
                    required: true
                }
            ]
        );
    }

    async run(interaction: CommandInteraction) {
        const lng = { lng: interaction.locale };
        const channel = interaction.options.getChannel(this.options[0].name);
        if (channel.type !== "GUILD_TEXT") {
            return interaction.reply(this.t("commands.channel.texts.error", lng));
        }

        const database = await this.client.database.fetch(interaction.guildId);

        try {
            await database.configChannel(channel.id);

            return await interaction.reply(this.t("commands.channel.texts.success", { ...lng, channel: `<#${channel.id}>` }));
        } catch (e) {
            return await interaction.reply(this.t("vars.error", lng));
        }
    }
}