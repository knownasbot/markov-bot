import Command from "./Command";

import ClientInterface from "../interfaces/ClientInterface";
import SubCommandInterface from "../interfaces/SubCommandInterface";

export default class SubCommand extends Command {
    public type: SubCommandInterface["type"] = "SUB_COMMAND";

    constructor(client: ClientInterface, name: string, description: string, options?: SubCommandInterface["options"]) {
        super(client, name, description, options);
    }
}