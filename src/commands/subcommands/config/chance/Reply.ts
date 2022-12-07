import SubCommand from "../../../../structures/SubCommand";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../../../../interfaces/ClientInterface";

export default class ReplySubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.replyChance.command.name",
            "commands.replyChance.command.description",
            [
                {
                    type: "INTEGER",
                    name: "commands.replyChance.command.options.0.name",
                    description: "commands.replyChance.command.options.0.description",
                    required: true,
                    minValue: 1,
                    maxValue: 100
                }
            ]
        );
    }

    async run(interaction: CommandInteraction) {
        const lng = { lng: interaction.locale };

        let chance = interaction.options.getInteger(this.options[0].name);
        if (!chance || chance > 100 || chance < 1) return;

        const database = await this.client.database.fetch(interaction.guildId);

        try {
            await database.setReplyPercentage(chance / 100);

            return interaction.reply(this.t("commands.replyChance.text", { ...lng, chance }));
        } catch(e) {
            return interaction.reply({ content: this.t("vars.error", lng), ephemeral: true });
        }
    }
}