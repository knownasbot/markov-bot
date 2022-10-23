import { Message, MessageActionRow, MessageButton } from "discord.js";
import Command from "../structures/Command";

import { ButtonInteraction, CommandInteraction, PermissionResolvable } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class DeleteTextsCommand extends Command {
    public permissions: PermissionResolvable = "MANAGE_MESSAGES";

    constructor(client: ClientInterface) {
        super(
            client,
            "commands.deleteTexts.command.name",
            "commands.deleteTexts.command.description",
            [
                {
                    type: "USER",
                    name: "commands.deleteTexts.command.options.0.name",
                    description: "commands.deleteTexts.command.options.0.description"
                }
            ]
        );
    }

    async run(interaction: CommandInteraction) {
        const lng = { lng: interaction.locale };
        const database = await this.client.database.fetch(interaction.guildId);

        let member = interaction.options.get(this.options[0].name)?.value.toString();

        let deletePermission: boolean = false;
        if (member == interaction.user.id) {
            deletePermission = true;
        } else if (typeof interaction.member.permissions != "string") {
            deletePermission = interaction.member.permissions.has("MANAGE_MESSAGES");
        }

        if (!deletePermission) {
            return interaction.reply(this.t("commands.deleteTexts.texts.nopermission", lng));
        }

        const confirmationRow = new MessageActionRow()
            .addComponents(
                new MessageButton()
                .setCustomId("confirm")
                .setLabel(this.t("commands.deleteTexts.texts.confirmButton", lng))
                .setStyle("SUCCESS"),
                
                new MessageButton()
                .setCustomId("cancel")
                .setLabel(this.t("commands.deleteTexts.texts.cancelButton", lng))
                .setStyle("DANGER")
            );
        
        try {
            let textsLength = await database.getTextsLength();
            if (member) {
                textsLength = database.textsInfo.filter(v => v.author == member).length
            }
            if (textsLength < 1) return interaction.reply(this.t("commands.deleteTexts.texts.notexts", lng));

            const confirmationMessage: Message | any = await interaction.reply({
                content: this.t("commands.deleteTexts.texts.confirmation", { ...lng, textsLength }),
                components: [ confirmationRow ],
                fetchReply: true
            });
            if (!confirmationMessage) return;

            if (confirmationMessage instanceof Message) {
                const filter = (i: ButtonInteraction) => i.isButton() && (i.customId == "confirm" || i.customId == "cancel") && i.user.id == interaction.user.id;
                const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 30000 });
                collector.on("collect", async (i: ButtonInteraction) => {
                    if (i.customId == "confirm") {
                        (member ? database.deleteUserTexts(member) : database.deleteAllTexts())
                            .then(() => i.update({
                                content: this.t("commands.deleteTexts.texts.success", { ...lng, textsLength }),
                                components: []
                            }))
                            .catch(() => i.update({ content: this.t("vars.error", lng), components: [] }));

                        return collector.stop();
                    }

                    return collector.stop("cancel");
                });
                collector.on("end", (_, reason: string) => {
                    if (reason == "cancel" || reason == "time") {
                        confirmationMessage.edit({ content: this.t("commands.deleteTexts.texts.cancel", lng), components: []});
                    }
                });
            }
        } catch(e) {
            return interaction.reply(this.t("vars.error", lng));
        }
    }
}