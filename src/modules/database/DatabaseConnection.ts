import { connect } from "mongoose";
import { EventEmitter } from "events";

interface DatabaseConnectionInteface {
    on(event: "ready", listener: Function): this
}

export default class DatabaseConnection extends EventEmitter implements DatabaseConnectionInteface {
    constructor(uri: string) {
        super();

        this.connect(uri);
    }

    /**
     * Connects to MongoDB database.
     * @param uri Database URI.
     * @returns Nothing, but the `ready` event is emitted when ready.
     */
    private connect(uri: string): void {
        return connect(uri, err => {
            if (err) {
                console.error("[Database]", "Failed to connect to the database:\n", err);
                console.log("[Database]", "Trying again...");
                
                return this.connect(uri);
            }

            this.emit("ready");
        });
    }
}