import { ApplicationCommandOptionData } from "discord.js/typings";
import BaseCommandInterface from "./BaseCommandInterface";

export default interface SubCommandInterface extends BaseCommandInterface {
    type: "SUB_COMMAND";
    options?: ApplicationCommandOptionData[];
};