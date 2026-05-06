"use server";
import "dotenv/config";

export async function pharmacistDeniedSlackMessage(
  message: string
): Promise<Response | null> {
  try {
    const URL = process.env.PHARMACIST_DENIED_SLACK_URL;
    if (!URL) {
      console.error("PHARMACIST_DENIED_SLACK_URL is not set");
      return null;
    }
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
      }),
    });
    return response;
  } catch (error) {
    console.error(error);
    return null;
  }
}
