import { Client, Collection, Snowflake } from "discord.js/typings";
import * as i18next from "i18next";
import Cryptography from "../modules/cryptography";
import CommandInterface from "./CommandInterface";
import DatabaseManager from "../modules/database/DatabaseManager";

export default interface ClientInterface extends Client {
    config?: {
        admins?: string[];
        devGuilds?: string[];
        links: {
            website: string;
            tos: string;
            privacy: string;
            github: string;
            topgg: string;
            bmc: string;
        };
        emojis: {
            twitter: string;
            github: string;
            topgg: string;
            bmc: string;
            bitcoin:  string;
            ethereum: string;
        };
        cryptoAddresses: {
            bitcoin: string;
            ethereum: string;
        };
    };
    crypto?: Cryptography;
    cooldown?: Collection<Snowflake, number>;
    commands?: Collection<string, CommandInterface>;
    database?: DatabaseManager;
    i18n?: typeof i18next;
};