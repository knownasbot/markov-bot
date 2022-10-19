import { ApplicationCommandOptionData, PermissionResolvable } from "discord.js/typings";

export default interface CommandOptionsInterface {
    type?: "SUB_COMMAND_GROUP";
    options?: ApplicationCommandOptionData[];
    permission?: PermissionResolvable;
};