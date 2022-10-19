import { t } from "i18next";

import ClientInterface from "../interfaces/ClientInterface";
import BaseCommandInterface from "../interfaces/BaseCommandInterface";

export default class BaseCommand implements BaseCommandInterface {
    public t: typeof t;
    public client: ClientInterface;
    public dev: boolean = false;
    public skipBan: boolean = false;

    public name: string;
    public description: string;
    public nameLocalizations: Record<string, string> = {};
    public descriptionLocalizations: Record<string, string> = {};

    constructor(client: ClientInterface, name: string, description: string) {
        this.t = client.i18n.t;
        this.client = client;
        this.name = name;
        this.description = description;
    }
}