import Command from "../structures/Command";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class GenerateCommand extends Command {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.generate.command.name",
            "commands.generate.command.description",
            {
                options: [
                    {
                        type: "INTEGER",
                        name: "commands.generate.command.options.0.name",
                        description: "commands.generate.command.options.0.description",
                        minValue: 1,
                        maxValue: 1000
                    }
                ]
            }
        );
    }

    async run(interaction: CommandInteraction) {
        const database = await this.client.database.fetch(interaction.guildId);

        const size = interaction.options.getInteger(this.options[0].name) ?? Math.floor(Math.random() * 30);
        const textsLength = await database.getTextsLength();

        let generatedText = database.markovChains.generateChain(size);
        if (generatedText?.length > 2000) generatedText = generatedText.slice(0, 2000 - 3) + "...";

        if (generatedText && textsLength > 0 && generatedText.trim().length > 0) {
            return await interaction.reply(generatedText);
        } else {
            return await interaction.reply(this.t("commands.generate.error", { lng: interaction.locale }));
        }
    }
}