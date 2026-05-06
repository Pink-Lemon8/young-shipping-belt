"use server";
import { UTFile } from "uploadthing/server";

export async function base64ToFile(base64: string, name: string, type: string, customId: string | undefined = undefined): Promise<UTFile | undefined> {
    try {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new UTFile([byteArray], name, { type: type, customId: customId });
        return file;
    } catch (error) {
        return undefined;
    }
}

export async function URLToBase64(imageUrl: string): Promise<string | undefined> {
    try {

        const response = await fetch(imageUrl);
        const imageBuffer = await response.arrayBuffer();

        const base64 = Buffer.from(imageBuffer).toString("base64");
        return base64;
    } catch (error) {
        return undefined;
    }
}