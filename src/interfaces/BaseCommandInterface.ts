import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "./ClientInterface";

export default interface BaseCommandInterface {
    client: ClientInterface;
    dev: boolean;
    skipBan: boolean;

    name: string;
    description: string;
    nameLocalizations: Record<string, string>;
    descriptionLocalizations: Record<string, string>;

    run?(interaction: CommandInteraction): any;
};