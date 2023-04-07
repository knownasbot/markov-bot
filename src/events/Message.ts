import { WebhookClient } from "discord.js";
import Event from "../structures/Event";
import specialEventList from "../modules/specialEvents";

import { Message, TextChannel } from "discord.js/typings";
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
            await client.database.isBanned(message.guildId)
        ) return;

        const database = await client.database.fetch(message.guildId);
        if (!database.toggledActivity) return;

        let channel: TextChannel;
        try {
            channel = await message.channel?.fetch() as TextChannel;
        } catch {
            return;
        }

        const channelId = await database.getChannel();
        const webhook = await database.getWebhook();
        const clientMember = await message.guild.members.fetchMe();
        const messagePermission = clientMember.permissionsIn(channel)?.has("SEND_MESSAGES");

        if (channel && message.channelId == channelId && messagePermission) {
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
            if (hasMention && guildCooldown + 1000 < Date.now()) {
                sendPercentage = await database.getReplyPercentage();
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

                let generatedText = database.markovChains.generateChain(Math.floor(Math.random() * 50));
                if (generatedText && generatedText.trim().length > 0) {
                    let timeout = Math.floor(5 + Math.random() * 5) * 1000;

                    if (!webhook) {
                        try {
                            await channel.sendTyping();

                            setTimeout(async () => {
                                try {
                                    if (hasMention) await message.reply(generatedText)
                                    else await channel.send(generatedText);
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