import ClientInterface from "../interfaces/ClientInterface";

export default class Event {
    public identifier: string;

    constructor(identifier: string) {
        this.identifier = identifier;
    }

    run?(client: ClientInterface, ...args: any[]): any
}