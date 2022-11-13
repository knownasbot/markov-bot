import { WSEventType } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class Event {
    public ws: boolean = false;
    public identifier: string | WSEventType;

    constructor(identifier: string | WSEventType) {
        this.identifier = identifier;
    }

    run?(client: ClientInterface, ...args: any[]): any
}