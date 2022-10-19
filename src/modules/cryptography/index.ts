import * as crypto from "crypto";

interface DecryptedText {
    author?: string;
    decrypted: string;
    encrypted: string;
};

export default class Cryptography {
    private algorithm = "aes-128-cbc";
    private password: Buffer;

    /**
     * Message content cryptography.
     * @param password Secret password.
     */
    constructor(password: string) {
        this.password = Buffer.from(password, "hex");
    }

    /**
     * Encrypts the text.
     * @param text Text.
     * @param author Author ID.
     * @returns Encrypted text in `iv:text:author` format.
     */
    encrypt(text: string, author: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.password, iv);
        const encrypted = Buffer.concat([ cipher.update(text), cipher.final() ]);

        return `${iv.toString("base64")}:${encrypted.toString("base64")}:${author}`;
    }

    /**
     * Decrypts the text.
     * @param text Text.
     * @returns The author and decrypted text.
     */
    async decrypt(text: string): Promise<DecryptedText> {
        if (!/^[0-9a-z+/=]+:[0-9a-z+/=]+:\d+$/i.test(text)) {
            return {
                decrypted: text,
                encrypted: text
            };
        }

        return new Promise((resolve) => {
            const values = text.split(":");
            const iv = Buffer.from(values[0], "base64");
            const encrypted = Buffer.from(values[1], "base64");
            const author = values[2];
            const decipher = crypto.createDecipheriv(this.algorithm, this.password, iv);
            
            let decrypted = "";
            decipher.on("readable", () => {
                let c;
                while (null != (c = decipher.read())) {
                    decrypted += c.toString();
                }
            });

            decipher.write(encrypted);
            decipher.end(() => {
                resolve({
                    author,
                    decrypted,
                    encrypted: text
                });
            });
        });
    }
}