import { BaseSpecialEvent } from "./BaseSpecialEvent";

import { Message } from "discord.js/typings";
import ClientInterface from "../../../interfaces/ClientInterface";

export class TimeSpecialEvent extends BaseSpecialEvent {
    private times = [
        "00:00",
        "00:00:00",
        "01:23",
        "01:23:56",
        "03:33",
        "03:33:33",
        "04:20",
        "04:21",
        "05:55",
        "05:55:55",
        "11:11",
        "11:11:11",
        "12:34",
        "12:34:56",
        "13:37",
        "15:33",
        "16:20",
        "23:59",
        "23:59:59"
    ]

    constructor() {
        super(
            "time",
            "Send message at specific times."
        );
    }

    async run(client: ClientInterface, message: Message): Promise<any> {
        const date = new Date();
        let hours = date.getHours(),
            minutes = date.getMinutes(),
            seconds = date.getSeconds();
        
        if (hours < 10) "0" + hours;
        if (minutes < 10) "0" + minutes;
        if (seconds < 10) "0" + seconds;

        let hourMinutes = `${hours}:${minutes}`;
        let hourMinutesSeconds = `${hourMinutes}:${seconds}`;

        let time;
        if (this.times.includes(hourMinutesSeconds)) time = hourMinutesSeconds
        else if (this.times.includes(hourMinutes) || (hourMinutes.replace(":", "") == date.getFullYear() + "")) time = hourMinutes;

        if (time) {
            client.cooldown.set(message.guildId, Date.now() + 60000);

            await message.channel.sendTyping();

            return message.channel.send(time);
        }
    }
}