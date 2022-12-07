import { Schema, model } from "mongoose";

interface ConfigModel {
    enabled: boolean;
    channelId: string;
    guildId: string;
    webhook: string;
    textsLimit: number;

    collectPercentage: number;
    sendingPercentage: number;
    replyPercentage: number;
};

const schema = new Schema<ConfigModel>({
    enabled: { type: Boolean, default: true },
    channelId: String,
    guildId: String,
    webhook: String,
    textsLimit: { type: Number, default: 500 },

    collectPercentage: { type: Number, default: 0.35 },
    sendingPercentage: { type: Number, default: 0.10 },
    replyPercentage: { type: Number, default: 0.25 }
});

export default model("configs", schema);