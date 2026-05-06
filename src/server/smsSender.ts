"use server";
import twilio from "twilio";
import "dotenv/config";

export async function messageBySms(body: string, to: string) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_NUMBER,
      to: to,
    });
    return message;
  } catch (error) {
    return undefined;
  }
}
