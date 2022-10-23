import Command from "./Command";

import ClientInterface from "../interfaces/ClientInterface";
import SubCommandGroupInterface from "../interfaces/SubCommandGroupInterface";

export default class SubCommandGroup extends Command {
    public type: SubCommandGroupInterface["type"] = "SUB_COMMAND_GROUP";

    constructor(client: ClientInterface, name: string, description: string, options?: SubCommandGroupInterface["options"]) {
        super(client, name, description, options);
    }
}