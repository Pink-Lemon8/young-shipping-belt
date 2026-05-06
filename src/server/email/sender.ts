"use server";
import "dotenv/config";
import { Resend } from "resend";
import MagicLinkEmail from "./templates/magic-link";
import OtpEmail from "./templates/otp";
import TwoFactorEnableEmail from "./templates/2fa-enable";
import ResetPasswordEmail from "./templates/reset-password";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(d: any = undefined) {
  const { data } = await resend.emails.send({
    from: "Parkway Shipping Auth <auth@parkwayshipping.ca>",
    to: [d.email ?? "delivered@resend.dev"],
    subject: "Parkway Shipping - Magic Link",
    react: MagicLinkEmail({
      name: d.name,
      magicLink: d.magicLink,
      expiryTime: d.expiryTime,
    }),
  } as any);
  return data;
}

export async function sendOTPEmail(d: any = undefined) {
  const { data } = await resend.emails.send({
    from: "Parkway Shipping Auth <auth@parkwayshipping.ca>",
    to: [d.email ?? "delivered@resend.dev"],
    subject: "Parkway Shipping - OTP",
    react: OtpEmail({
      name: d.name,
      otp: d.otp,
      expiryTime: d.expiryTime,
    }),
  } as any);
  return data;
}

export async function sendTwoFactorEnableEmail(d: any = undefined) {
  const { data } = await resend.emails.send({
    from: "Parkway Shipping Auth <auth@parkwayshipping.ca>",
    to: [d.email ?? "delivered@resend.dev"],
    subject: "Parkway Shipping - Two-Factor Authentication",
    react: TwoFactorEnableEmail({
      name: d.name,
      verificationCode: d.verificationCode,
      expiryTime: d.expiryTime,
      supportEmail: d.supportEmail,
      requestTime: d.requestTime,
      ipAddress: d.ipAddress,
      deviceInfo: d.deviceInfo,
    }),
  } as any);
  return data;
}

export async function sendResetPasswordEmail(d: any = undefined) {
  const { data } = await resend.emails.send({
    from: "Parkway Shipping Auth <auth@parkwayshipping.ca>",
    to: [d.email ?? "delivered@resend.dev"],
    subject: "Parkway Shipping - Reset Password",
    react: ResetPasswordEmail({
      name: d.name,
      resetToken: d.resetToken,
      expiryTime: d.expiryTime,
    }),
  } as any);
  return data;
}
