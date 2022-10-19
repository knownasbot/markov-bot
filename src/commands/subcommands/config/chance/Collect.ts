import SubCommand from "../../../../structures/SubCommand";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../../../../interfaces/ClientInterface";

export default class CollectSubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.collectChance.command.name",
            "commands.collectChance.command.description",
            [
                {
                    type: "INTEGER",
                    name: "commands.collectChance.command.options.0.name",
                    description: "commands.collectChance.command.options.0.description",
                    required: true,
                    minValue: 1,
                    maxValue: 50
                }
            ]
        );
    }

    async run(interaction: CommandInteraction) {
        const lng = { lng: interaction.locale };

        let chance = interaction.options.getInteger(this.options[0].name);
        if (!chance || chance > 50 || chance < 1) return;

        const database = await this.client.database.fetch(interaction.guildId);

        try {
            await database.setCollectionPercentage(chance / 100);

            return interaction.reply(this.t("commands.collectChance.text", { ...lng, chance }));
        } catch(e) {
            return interaction.reply({ content: this.t("vars.error", lng), ephemeral: true });
        }
    }
}