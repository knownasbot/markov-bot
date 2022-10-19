import axios from "axios";
import { WebhookClient } from "discord.js";
import SubCommand from "../../../structures/SubCommand";

import { CommandInteraction } from "discord.js/typings";
import ClientInterface from "../../../interfaces/ClientInterface";

export default class WebhookSubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.webhook.command.name",
            "commands.webhook.command.description",
            [
                {
                    type: "STRING",
                    name: "url",
                    description: "commands.webhook.command.options.0.description"
                }
            ]
        );
    }

    async run(interaction: CommandInteraction) {
        const lng = { lng: interaction.locale };
        const database = await this.client.database.fetch(interaction.guildId);
        
        let webhookURL = interaction.options.getString("url");
        if (webhookURL) {
            try {
                new WebhookClient({ url: webhookURL });

                let res = await axios.get(webhookURL);
                if (res.status != 200)
                    throw new Error(res.data.message);

                if (res.data.guild_id != interaction.guildId)
                    return interaction.reply({ content: this.t("commands.webhook.texts.guildError", lng), ephemeral: true });

                try {
                    await database.configWebhook(webhookURL);
                    await database.configChannel(res.data.channel_id);
                } catch {
                    return interaction.reply({ content: this.t("vars.error", lng), ephemeral: true });
                }

                return interaction.reply({ content: this.t("commands.webhook.texts.success", { ...lng, name: res.data.name.replace(/[`*\\]+/g, "") }), ephemeral: true });
            } catch {
                return interaction.reply({ content: this.t("commands.webhook.texts.error", lng), ephemeral: true });
            }
        } else {
            try {
                await database.configWebhook();

                return interaction.reply({ content: this.t("commands.webhook.texts.disabled", lng) });
            } catch {};
        }
    }
}