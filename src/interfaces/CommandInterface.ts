import { CommandInteraction, ApplicationCommandOptionData, PermissionResolvable } from "discord.js/typings";
import ClientInterface from "./ClientInterface";

export default interface CommandInterface {
    client: ClientInterface;
    dev: boolean;
    skipBan: boolean;
    allowedDm: boolean;
    permissions?: PermissionResolvable;

    name: string;
    description: string;
    nameLocalizations: Record<string, string>;
    descriptionLocalizations: Record<string, string>;
    options?: ApplicationCommandOptionData[];

    run?(interaction: CommandInteraction): any;
};