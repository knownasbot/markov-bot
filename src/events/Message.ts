import { WebhookClient } from "discord.js";
import Event from "../structures/Event";
import specialEventList from "../modules/specialEvents";

import { Message } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";
import SpecialEventInterface from "../interfaces/SpecialEventInterface";

export default class MessageCreate extends Event {
    constructor() {
        super("messageCreate");
    }

    async run(client: ClientInterface, message: Message): Promise<void> {
        if (
            message.author.bot ||
            !message.content ||
            message.content.trim().length < 1 ||
            message.channel.type != "GUILD_TEXT" ||
            await client.database.isBanned(message.guildId)
        ) return;

        const database = await client.database.fetch(message.guildId);
        if (!database.toggledActivity) return;

        let channel;
        try {
            channel = await message.channel?.fetch();
        } catch {};

        const channelId = await database.getChannel();
        const webhook = await database.getWebhook();
        const messagePermission = channel?.permissionsFor && channel?.permissionsFor(message.guild.me)?.has("SEND_MESSAGES");

        if (message.channel && message.channelId == channelId && messagePermission) {
            const hasMention = message.mentions.has(client.user);
            const textsLength = await database.getTextsLength();
            let guildCooldown = client.cooldown.get(message.guildId) ?? 0;
            let sendPercentage = await database.getSendingPercentage();
            let collectPercentage = await database.getCollectionPercentage();

            if (Math.random() <= collectPercentage) {
                client.database.isTrackAllowed(message.author.id)
                    .then(async () => await database.addText(message.content, message.author.id, message.id))
                    .catch(() => {});
            }

            if (textsLength < 5) return;
            if (hasMention && guildCooldown + 5000 < Date.now()) {
                sendPercentage = 0.25;
                guildCooldown = 0;
            }

            if (Math.random() <= sendPercentage && guildCooldown + 15000 < Date.now()) {      
                client.cooldown.set(message.guildId, Date.now());
                
                if (Math.random() <= 0.05) {
                    const eventKeys = Object.keys(specialEventList);
                    let RandomEvent: SpecialEventInterface = new specialEventList[eventKeys[Math.floor(Math.random() * eventKeys.length)]]();
                    
                    try {
                        return await RandomEvent.run(client, message);
                    } catch {};
                }

                let generatedText = database.markovChains.generateChain(Math.floor(Math.random() * 30));
                if (generatedText && generatedText.trim().length > 0) {
                    let timeout = Math.floor(5 + Math.random() * 5) * 1000;

                    if (!webhook) {
                        try {
                            await message.channel.sendTyping();

                            setTimeout(async () => {
                                try {
                                    if (hasMention) await message.reply(generatedText)
                                    else await message.channel.send(generatedText);
                                } catch {}; // Probably has no permission
                            }, timeout);
                        } catch {}; // Probably has no permission
                    } else {
                        setTimeout(async () => {
                            try {
                                let webhookClient = new WebhookClient({ url: webhook }, { allowedMentions: { parse: [] } });

                                await webhookClient.send(generatedText);
                            } catch {};
                        }, timeout);
                    }
                }
            }
        }
    }
}