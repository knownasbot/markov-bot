import Command from "../structures/Command";
import { SnowflakeUtil } from "discord.js";

import { CommandInteraction, PermissionResolvable } from "discord.js/typings";
import ClientInterface from "../interfaces/ClientInterface";

export default class PopulateCommand extends Command {
    public dev: boolean = true;
    public skipBan: boolean = true;
    public permissions: PermissionResolvable = "MANAGE_GUILD";

    private words: string[] = [];

    constructor(client: ClientInterface) {
        super(
            client,
            "commands.populate.command.name",
            "commands.populate.command.description",
            [
                {
                    type: "INTEGER",
                    name: "commands.populate.command.options.0.name",
                    description: "commands.populate.command.options.0.description",
                    required: true,
                    minValue: 1
                },
                {
                    type: "USER",
                    name: "commands.populate.command.options.1.name",
                    description: "commands.populate.command.options.1.description"
                }
            ]
        );

        const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Faucibus a pellentesque sit amet porttitor eget dolor morbi non. Laoreet non curabitur gravida arcu ac tortor dignissim convallis aenean. Blandit massa enim nec dui nunc mattis enim ut tellus. Id neque aliquam vestibulum morbi. Faucibus et molestie ac feugiat sed. Sed nisi lacus sed viverra tellus. Cursus metus aliquam eleifend mi in nulla posuere sollicitudin aliquam. Nisl suscipit adipiscing bibendum est. Facilisi morbi tempus iaculis urna id volutpat lacus laoreet non. Dolor morbi non arcu risus quis varius quam quisque. Nibh venenatis cras sed felis. Neque viverra justo nec ultrices dui sapien. Non nisi est sit amet facilisis. Venenatis tellus in metus vulputate eu scelerisque felis imperdiet proin. Cras adipiscing enim eu turpis egestas pretium aenean pharetra magna. Erat velit scelerisque in dictum non consectetur a erat. Odio tempor orci dapibus ultrices in iaculis.";

        this.words = loremIpsum.split(" ").map((v) => v.toLowerCase());
    }

    async run(interaction: CommandInteraction) {
        const amount = interaction.options.getInteger("amount");
        const member = interaction.options.getUser("member")?.id ?? interaction.user.id;

        const database = await this.client.database.fetch(interaction.guildId);

        await interaction.deferReply();

        for (let i=0; i < amount; i++) {
            await database.addText(this.randomText(), member, this.randomId());
        }

        return interaction.editReply(this.t("commands.populate.text", { lng: interaction.locale, amount }));
    }

    private randomId(): string {
        return SnowflakeUtil.generate(Date.now() + Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    }

    private randomText(): string {
        let generatedText = "";
        let upper = true;

        for (let j=0; j < Math.floor(Math.random() * 30) + 1; j++) {
            let word = this.words[Math.floor(Math.random() * this.words.length)];

            if (upper) {
                word = word[0].toUpperCase() + word.slice(1);
            }

            upper = word.endsWith(".");
            generatedText += word + " ";
        }

        if (!generatedText.trim().endsWith(".")) {
            generatedText = generatedText.trim() + ".";
        }

        return generatedText;
    }
}