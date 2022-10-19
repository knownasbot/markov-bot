import { Schema, model } from "mongoose";

interface NoTrackModel {
    userId: string;
};

const schema = new Schema<NoTrackModel>({
    userId: String
});

export default model("notrack", schema);