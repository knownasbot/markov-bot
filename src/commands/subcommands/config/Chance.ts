import SubCommandGroup from "../../../structures/SubCommandGroup";

import ClientInterface from "../../../interfaces/ClientInterface";
import SubCommandInterface from "../../../interfaces/SubCommandInterface";
import SubCommandGroupInterface from "../../../interfaces/SubCommandGroupInterface";
import { CommandInteraction } from "discord.js/typings";

import CollectSubCommand from "./chance/Collect";
import SendingSubCommand from "./chance/Sending";

export default class ChanceSubCommandGroup extends SubCommandGroup {
    private subcommands: Record<string, SubCommandInterface | SubCommandGroupInterface>;

    constructor(client: ClientInterface) {
        super(
            client,
            "commands.chance.command.name",
            "commands.chance.command.description"
        );

        const subcommands = {
            collect: new CollectSubCommand(client),
            send: new SendingSubCommand(client)
        }

        let options = [];

        for (let key of Object.keys(subcommands)) {
            let subcommand: SubCommandInterface | SubCommandGroupInterface = subcommands[key];
            options.push({
                type: subcommand.type,
                name: subcommand.name,
                description: subcommand.description,
                options: subcommand.options
            });
        }

        this.setOptions(options);

        this.subcommands = subcommands;
    }

    async run(interaction: CommandInteraction) {
        const subCommandName = interaction.options.getSubcommand();
        const subCommand = Object.values(this.subcommands).find(cmd => this.t(cmd.name) == subCommandName);
        if (subCommand) return subCommand.run(interaction);
    }
}