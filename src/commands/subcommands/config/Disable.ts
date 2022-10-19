import SubCommand from "../../../structures/SubCommand";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../../../interfaces/ClientInterface";

export default class DisableSubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.disable.command.name",
            "commands.disable.command.description",
        );
    }

    async run(interaction: CommandInteraction) {
        const lng = { lng: interaction.locale };
        const database = await this.client.database.fetch(interaction.guildId);

        try {
            await database.toggleActivity(false);

            return interaction.reply(this.t("commands.disable.text", lng));
        } catch(e) {
            return interaction.reply(this.t("vars.error", lng));
        }
    }
}