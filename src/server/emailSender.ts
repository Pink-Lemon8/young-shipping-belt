"use server";
import "dotenv/config";
import { ForgotPasswordEmail } from "@/components/email-template/forgot-password-email";
import { Resend } from "resend";


export async function sendForgotPasswordEmail(d: any = undefined) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data } = await resend.emails.send({
    from: "Parkway Pharmacy <hello@parkwaypharmacy.com>",
    to: [d.email ?? "delivered@resend.dev"],
    subject: "Reset Your Parkway Pharmacy Password",
    react: ForgotPasswordEmail({ data: d }),
  } as any);
}

export async function sendContactUs(d: any = undefined) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data } = await resend.emails.send({
    from: d.name + " <hello@parkwaypharmacy.com>",
    to: ["hello@parkwaypharmacy.com"],
    subject: "Parkway Pharmacy Contact US - " + (d.name ?? ""),
    html: d.name + "<br />" + d.email + "<br />" + d.message,
  } as any);
}
