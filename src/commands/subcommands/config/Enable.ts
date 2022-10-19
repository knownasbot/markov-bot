import SubCommand from "../../../structures/SubCommand";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../../../interfaces/ClientInterface";

export default class EnableSubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.enable.command.name",
            "commands.enable.command.description"
        );
    }

    async run(interaction: CommandInteraction) {
        const lng = { lng: interaction.locale };
        const database = await this.client.database.fetch(interaction.guildId);

        try {
            await database.toggleActivity(true);

            return interaction.reply(this.t("commands.enable.text", lng));
        } catch(e) {
            return interaction.reply(this.t("vars.error", lng));
        }
    }
}