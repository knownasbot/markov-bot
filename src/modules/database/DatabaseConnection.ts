import { connect } from "mongoose";

export default class DatabaseConnection {
    private uri: string;

    constructor(uri: string) {
        this.uri = uri;
    }

    /**
     * Connects to MongoDB database.
     */
    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            connect(this.uri, err => {
                if (err) {
                    console.error("[Database]", "Failed to connect to the database:\n", err);

                    reject(err);
                }

                resolve();
            });
        });
    }
}