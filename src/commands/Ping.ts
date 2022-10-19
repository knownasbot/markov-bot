import Command from "../structures/Command";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class PingCommand extends Command {
    public skipBan: boolean = true;

    constructor(client: ClientInterface) {
        super(
            client,
            "ping",
            "commands.ping.command.description"
        );
    }

    async run(interaction: CommandInteraction) {
        return interaction.reply(`🏓 **Ping:** ${this.client.ws.ping} ms.`);
    }
}