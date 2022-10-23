import SubCommandGroup from "../../../structures/SubCommandGroup";

import ClientInterface from "../../../interfaces/ClientInterface";
import SubCommandInterface from "../../../interfaces/SubCommandInterface";
import { CommandInteraction } from "discord.js/typings";

import CollectSubCommand from "./chance/Collect";
import SendingSubCommand from "./chance/Sending";

export default class ChanceSubCommandGroup extends SubCommandGroup {
    private subcommands: Record<string, SubCommandInterface>;

    constructor(client: ClientInterface) {
        super(
            client,
            "commands.chance.command.name",
            "commands.chance.command.description"
        );

        const subcommands = {
            collect: new CollectSubCommand(client),
            send: new SendingSubCommand(client)
        };

        let options = [];

        for (let key of Object.keys(subcommands)) {
            let subcommand: SubCommandInterface = subcommands[key];
            options.push({
                type: subcommand.type,
                name: subcommand.name,
                description: subcommand.description,
                options: subcommand.options
            });
        }

        this.options = options;
        this.subcommands = subcommands;
    }

    async run(interaction: CommandInteraction) {
        const subCommandName = interaction.options.getSubcommand();
        const subCommand = this.subcommands[subCommandName];
        if (subCommand) return subCommand.run(interaction);
    }
}