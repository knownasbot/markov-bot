import { readdirSync } from "fs";
import * as path from "path";

import ClientInterface from "../interfaces/ClientInterface";

interface EventInterface {
    (client?: ClientInterface): void,

    identifier: string,

    run(...args: any[]): any
}

export default class EventHandler {
    constructor(client: ClientInterface) {
        const events = readdirSync(path.join(__dirname, "../events"));

        events.forEach(v => {
            const fileName: string = v.split(".")[0];
            if (fileName == "BaseEvent" || v.endsWith(".json")) return;

            const Event = require("../events/" + fileName).default;
            const props: EventInterface = new Event(client);

            client.on(props.identifier, props.run.bind(props, client));
        });
    }
}