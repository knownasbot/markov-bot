import Command from "../structures/Command";

import ChannelSubCommand from "./subcommands/config/Channel";
import EnableSubCommand from "./subcommands/config/Enable";
import DisableSubCommand from "./subcommands/config/Disable";
import ChanceSubCommand from "./subcommands/config/Chance";
import WebhookSubCommand from "./subcommands/config/Webhook";
import LimitSubCommand from "./subcommands/config/Limit";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";
import SubCommandInterface from "../interfaces/SubCommandInterface";
import SubCommandGroupInterface from "../interfaces/SubCommandGroupInterface";

export default class ConfigCommand extends Command {
    private subcommands: Record<string, SubCommandInterface | SubCommandGroupInterface>;

    constructor(client: ClientInterface) {
        super(
            client,
            "commands.config.command.name",
            "commands.config.command.description",
            {
                permission: "MANAGE_GUILD"
            }
        );

        const subcommands = {
            channel: new ChannelSubCommand(client),
            enable: new EnableSubCommand(client),
            disable: new DisableSubCommand(client),
            chance: new ChanceSubCommand(client),
            webhook: new WebhookSubCommand(client),
            limit: new LimitSubCommand(client)
        };

        const options = [];

        for (let key of Object.keys(subcommands)) {
            let subcommand: SubCommandInterface | SubCommandGroupInterface = subcommands[key];
            options.push({
                type: subcommand.type,
                name: subcommand.name,
                description: subcommand.description,
                options: subcommand.options
            });
        }
        
        this.setOptions({
            permission: this.permission,
            options
        });

        this.subcommands = subcommands;
    }

    async run(interaction: CommandInteraction) {
        const subCommandName = interaction.options.data[0].name;
        const subCommand = this.subcommands[subCommandName];
        if (subCommand) return subCommand.run(interaction);
    }
}