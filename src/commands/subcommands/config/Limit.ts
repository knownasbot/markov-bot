import SubCommand from "../../../structures/SubCommand";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../../../interfaces/ClientInterface";

export default class LimitSubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.limit.command.name",
            "commands.limit.command.description",
            [
                {
                    type: "INTEGER",
                    name: "commands.limit.command.options.0.name",
                    description: "commands.limit.command.options.0.description",
                    minValue: 5,
                    maxValue: new Date().getFullYear()
                }
            ]
        );
    }

    async run(interaction: CommandInteraction) {
        const lng = { lng: interaction.locale };
        const database = await this.client.database.fetch(interaction.guildId);

        const limit = interaction.options.getInteger(this.options[0].name);
        try {
            await database.configTextsLimit(limit);

            return interaction.reply(this.t("commands.limit.text", { ...lng, limit }));
        } catch {
            return interaction.reply(this.t("vars.error", lng));
        }
    }
}