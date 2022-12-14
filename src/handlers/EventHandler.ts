import { readdirSync } from "fs";
import * as path from "path";
import Event from "../structures/Event";

import { WSEventType } from "discord.js";
import ClientInterface from "../interfaces/ClientInterface";

export default class EventHandler {
    constructor(client: ClientInterface) {
        const events = readdirSync(path.join(__dirname, "../events"));

        events.forEach(v => {
            const fileName: string = v.split(".")[0];
            if (v.endsWith(".json")) return;

            const LoadedEvent = require("../events/" + fileName).default;
            const props: Event = new LoadedEvent();

            if (props.ws) {
                client.ws.on(props.identifier as WSEventType, props.run.bind(props, client));
            } else {
                client.on(props.identifier, props.run.bind(props, client));
            }
        });
    }
}