import { t } from "i18next";

import ClientInterface from "../interfaces/ClientInterface";
import CommandInterface from "../interfaces/CommandInterface";

export default class Command implements CommandInterface {
    public t: typeof t;
    public client: ClientInterface;
    public dev: boolean = false;
    public skipBan: boolean = false;
    public allowedDm: boolean = false;
    public permissions: CommandInterface["permissions"];

    public name: string;
    public description: string;
    public nameLocalizations: Record<string, string> = {};
    public descriptionLocalizations: Record<string, string> = {};
    public options: CommandInterface["options"];

    constructor(client: ClientInterface, name: string, description: string, options?: CommandInterface["options"]) {
        this.t = client.i18n.t;
        this.client = client;
        this.name = name;
        this.description = description;
        
        if (options) {
            this.options = options;
        }
    }
}