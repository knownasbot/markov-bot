import Command from "../structures/Command";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class TrackingCommand extends Command {
    public skipBan: boolean = true;

    constructor(client: ClientInterface) {
        super(
            client,
            "commands.tracking.command.name",
            "commands.tracking.command.description"
        );
    }

    async run(interaction: CommandInteraction) {
        const lng = { lng: interaction.locale };
        const state = await this.client.database.toggleTrack(interaction.user.id);

        if (state) {
            return interaction.reply({
                content: this.t("commands.tracking.texts.enabled", lng),
                ephemeral: true
            });
        } else {
            return interaction.reply({
                content: this.t("commands.tracking.texts.disabled", lng),
                ephemeral: true
            });
        }
    }
}