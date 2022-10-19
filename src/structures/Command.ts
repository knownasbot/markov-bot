import BaseCommand from "./BaseCommand";

import ClientInterface from "../interfaces/ClientInterface";
import CommandInterface from "../interfaces/CommandInterface";
import CommandOptionsInterface from "../interfaces/CommandOptionsInterface";

export default class Command extends BaseCommand implements CommandInterface {
    public options?: CommandInterface["options"];
    public permission?: CommandInterface["permission"];

    constructor(client: ClientInterface, name: string, description: string, options?: CommandOptionsInterface) {
        super(client, name, description);
        this.setOptions(options);
    }

    setOptions(options: CommandOptionsInterface) {
        this.options = options?.options;
        this.permission = options?.permission;
    }
}