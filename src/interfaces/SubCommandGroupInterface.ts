import { ApplicationCommandSubGroup } from "discord.js/typings";
import BaseCommandInterface from "./BaseCommandInterface";

export default interface SubCommandGroupInterface extends BaseCommandInterface {
    type: "SUB_COMMAND_GROUP";
    options?: ApplicationCommandSubGroup[];
};