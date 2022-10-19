import Command from "../structures/Command";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class BanCommand extends Command {
    public dev: boolean = true;
    public skipBan: boolean = true;

    constructor(client: ClientInterface) {
        super(
            client,
            "commands.ban.command.name",
            "commands.ban.command.description",
            {
                options: [
                    {
                        type: "STRING",
                        name: "commands.ban.command.options.0.name",
                        description: "commands.ban.command.options.0.description",
                        required: true
                    },
                    {
                        type: "STRING",
                        name: "commands.ban.command.options.1.name",
                        description: "commands.ban.command.options.1.description",
                        required: true
                    }
                ]
            }
        );
    }

    async run(interaction: CommandInteraction) {
        const guild = interaction.options.getString(this.t("commands.ban.command.options.0.name"));
        const reason = interaction.options.getString(this.t("commands.ban.command.options.1.name"));

        await this.client.database.ban(guild, reason);

        return interaction.reply(
            this.t("commands.ban.texts.success", { lng: interaction.locale, guild, reason })
        );
    }
}