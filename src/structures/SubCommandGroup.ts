import BaseCommand from "./BaseCommand";

import ClientInterface from "../interfaces/ClientInterface";
import SubCommandGroupInterface from "../interfaces/SubCommandGroupInterface";

export default class SubCommandGroup extends BaseCommand implements SubCommandGroupInterface {
    public type: "SUB_COMMAND_GROUP" = "SUB_COMMAND_GROUP";
    public options?: SubCommandGroupInterface["options"];

    constructor(client: ClientInterface, name: string, description: string, options?: SubCommandGroupInterface["options"]) {
        super(client, name, description);
        this.setOptions(options);
    }

    setOptions(options: SubCommandGroupInterface["options"]) {
        this.options = options;
    }
}