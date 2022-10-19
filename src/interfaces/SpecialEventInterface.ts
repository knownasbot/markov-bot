import { Message } from "discord.js/typings";
import ClientInterface from "./ClientInterface";

export default interface SpecialEventInterface {
    id: string;
    description: string;

    run(client: ClientInterface, message: Message): any;
};