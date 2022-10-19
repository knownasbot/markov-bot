import { readdirSync } from "fs";
import * as path from "path";

import { ApplicationCommandData } from "discord.js/typings";
import CommandInterface from "../interfaces/CommandInterface";
import ClientInterface from "../interfaces/ClientInterface";

export default class CommandHandler {
    private loadedLocales: string[];

    constructor(client: ClientInterface) {
        const commands = readdirSync(path.join(__dirname, "../commands"));
        const commandsOptions: ApplicationCommandData[] = [];
        const devCommandOptions: ApplicationCommandData[] = [];

        // @ts-ignore
        this.loadedLocales = Object.keys(client.i18n.services.resourceStore.data);

        commands.forEach(v => {
            const fileName: string = v.split(".")[0];
            if (!v.includes(".") || fileName == "BaseCommand") return;

            try {
                const Command = require("../commands/" + fileName).default;
                let props: CommandInterface = new Command(client);
                if (props.name.startsWith("-")) return;

                props = this.translateCommand(client.i18n, props);

                const cmd = {
                    name: props.name,
                    description: props.description,
                    nameLocalizations: props.nameLocalizations,
                    descriptionLocalizations: props.descriptionLocalizations,
                    options: props.options
                };
                
                client.commands.set(props.name, props);
                
                if (!props.dev) {
                    commandsOptions.push(cmd);
                } else {
                    devCommandOptions.push(cmd);
                }
            } catch(e) {
                console.log("[Commands]", `Failed to load the command "${v}":\n`, e);
            }
        });

        client.application.commands.set(commandsOptions)
        .catch(e => console.error("[Commands]", `Failed to register the commands:\n`, e));

        // Register temporary commands for testing
        for (let guildId of client.config.devGuilds) {
            client.guilds.fetch(guildId)
            .then(async guild => {
                try {
                    await client.application.commands.set(devCommandOptions, guildId);
                } catch(e) {
                    console.error("[Commands]", `Failed to register the commands on guild ${guildId}:\n`, e);
                }
            })
            .catch(e => console.error("[Commands]", `Failed to fetch the developer's guild ${guildId}:\n`, e));
        }
    }

    private translateCommand(i18n: ClientInterface["i18n"], props): CommandInterface {
        const { t } = i18n;
        const { name, description } = props;

        // Default command info
        props.name = /[a-z]\.[a-z]/.test(name) ? t(name) : name;
        props.description = /[a-z]\.[a-z]/.test(description) ? t(description, { recommend: 500 }) : description;

        if (props.options?.length > 0) {
            for (let option of props.options) {
                option = this.translateCommand(i18n, option);
            }
        }

        // Command localizations
        for (let lng of this.loadedLocales) {
            const code = t("code", { lng });
            if (!/[a-z]{2}-[A-Z]{2}/.test(code)) continue;
            if (!props.nameLocalizations) props.nameLocalizations = {};
            if (!props.descriptionLocalizations) props.descriptionLocalizations = {};

            props.nameLocalizations[code] = /[a-z]\.[a-z]/.test(name) ? t(name, { lng }) : name;
            props.descriptionLocalizations[code] = /[a-z]\.[a-z]/.test(description) ? t(description, { lng, recommend: 500 }) : description;
        }

        return props;
    }
}