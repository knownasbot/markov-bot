import { ApplicationCommandOptionData, PermissionResolvable } from "discord.js/typings";
import BaseCommandInterface from "./BaseCommandInterface";

export default interface CommandInterface extends BaseCommandInterface {
    options?: ApplicationCommandOptionData[];
    permission?: PermissionResolvable;
};