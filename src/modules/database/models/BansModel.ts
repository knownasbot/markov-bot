import { Schema, model } from "mongoose";

interface BansModel {
    guildId: string;
    reason: string;
};

const schema = new Schema<BansModel>({
    guildId: String,
    reason: String
});

export default model("bans", schema);