import { Schema, model } from "mongoose";

interface TextsModel {
    guildId: string;
    list: string[];
    expiresAt: { type: Date, default: number, expires: Date }
};

const schema = new Schema<TextsModel>({
    guildId: String,
    list: { type: [ String ], default: [] },
    expiresAt: { type: Date, default: Date.now() + (30 * 1000 * 60 * 60 * 24) }
});

export default model("texts", schema);