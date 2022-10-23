import Command from "../structures/Command";

import { CommandInteraction, PermissionResolvable } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class UnbanCommand extends Command {
    public dev: boolean = true;
    public skipBan: boolean = true;
    public permissions: PermissionResolvable = "MANAGE_GUILD";

    constructor(client: ClientInterface) {
        super(
            client,
            "commands.unban.command.name",
            "commands.unban.command.description",
            [
                {
                    type: "STRING",
                    name: "commands.unban.command.options.0.name",
                    description: "commands.unban.command.options.0.description",
                    required: true
                }
            ]
        );
    }

    async run(interaction: CommandInteraction) {
        const guild = interaction.options.getString(this.options[0].name);

        await this.client.database.unban(guild);

        return interaction.reply(
            this.t("commands.unban.texts.success", { lng: interaction.locale, guild })
        );
    }
}