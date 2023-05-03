declare global {
    namespace NodeJS {
        interface ProcessEnv {
            /** Bot token. */
            BOT_TOKEN: string;
            /** MongoDB URI. */
            DB_URI: string;
            /** Random secret hash used to encrypt and decrypt data. */
            CRYPTO_SECRET: string;
            /** Test bot token. */
            TEST_BOT_TOKEN?: string;
            /** Discord webhook for logs (guild join/leave, shard status...) */
            SERVER_LOG?: string;
        }
    }
}

export {};