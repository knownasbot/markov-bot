import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.BOT_TOKEN && !process.env.TEST_BOT_TOKEN) {
    throw new Error("[env] Missing bot token");
} else if (!process.env.DB_URI) {
    throw new Error("[env] Missing database URI");
} else if (!process.env.CRYPTO_SECRET) {
    throw new Error("[env] Missing cryptography secret");
}

import { Client, Intents, Collection } from "discord.js";
import axios from "axios";
import * as i18next from "i18next";
import * as i18nbackend from "i18next-fs-backend";

import Cryptography from "./modules/cryptography";
import DatabaseConnection from "./modules/database/DatabaseConnection";
import DatabaseManager from "./modules/database/DatabaseManager";

import EventHandler from "./handlers/EventHandler";
import ClientInterface from "./interfaces/ClientInterface";

const sweeper = {
    interval: 3600,
    filter: () => () => true
};
const client: ClientInterface = new Client({
    allowedMentions: { parse: [] },
    failIfNotExists: false,
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
    ],
    sweepers: {
        messages: sweeper,
        users: sweeper,
        guildMembers: {
            interval: 3600,
            filter: () => (member) => member.user.id != client.user.id
        }
    }
});

const dbConnection = new DatabaseConnection(process.env.DB_URI);

client.config = {
    admins: [ "283740954328825858" ],
    devGuilds: []
};
client.crypto = new Cryptography(process.env.CRYPTO_SECRET);
client.cooldown = new Collection();
client.commands = new Collection();
client.database = new DatabaseManager(client);
i18next
.use(i18nbackend)
.init({
    initImmediate: false,
    lng: "en",
    fallbackLng: "en",
    preload: ["en", "pt"],
    backend: {
        loadPath: "./locales/{{lng}}.json"
    },
    interpolation: {
        escapeValue: false
    }
}, (err) => {
    if (err) {
        throw new Error("[i18n] Failed to load the translations: " + err);
    }

    client.i18n = i18next;
});

new EventHandler(client);

dbConnection.on("ready", () => {
    console.log("[Database]", "Connected to the database.");
    
    client.login(process.env.TEST_BOT_TOKEN ?? process.env.BOT_TOKEN);
});

if (process.env.TOPGG_TOKEN) {
    let lastCount = 0;

    setInterval(async () => {
        if (lastCount != client.guilds.cache.size) {
            try {
                await axios.post(`https://top.gg/api/bots/${client.user.id}/stats`, {
                    server_count: client.guilds.cache.size
                }, {
                    headers: {
                        "Authorization": process.env.TOPGG_TOKEN
                    }
                });

                lastCount = client.guilds.cache.size;
            } catch(e) {
                console.error("[Top.gg]", "Failed to register top.gg stats:\n", e);
            }
        }
    }, 60*60*1000);
}