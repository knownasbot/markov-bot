import BaseCommand from "./BaseCommand";

import ClientInterface from "../interfaces/ClientInterface";
import SubCommandInterface from "../interfaces/SubCommandInterface";

export default class SubCommand extends BaseCommand implements SubCommandInterface {
    public type: "SUB_COMMAND" = "SUB_COMMAND";
    public options?: SubCommandInterface["options"];

    constructor(client: ClientInterface, name: string, description: string, options?: SubCommandInterface["options"]) {
        super(client, name, description);
        this.setOptions(options);
    }

    setOptions(options: SubCommandInterface["options"]) {
        this.options = options;
    }
}