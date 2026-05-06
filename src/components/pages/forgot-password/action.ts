"use server";
import { db } from "@/db/db";
import { logs, user, users } from "@/db/schema";
import { Result } from "@/lib/types";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function ForgetPasswordAction(email: string) {
  try {
    const forgetPassword: any = await auth.api.requestPasswordReset({
      body: {
        email: email,
      },
    });

    try {
      const clientIp = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
      const [userData] = await db
        .select()
        .from(user)
        .where(eq(user.email, email));

      const createLog = await db.insert(logs).values({
        userId: userData?.id?.toString(),
        action: "FORGOT_PASSWORD_REQUESTED",
        description:
          `User ${userData?.email ?? "Unknown"} requested a password reset by ip -> ` +
          clientIp,
      });
    } catch (error) {
      console.log(error);
    }
    return {
      status: forgetPassword.status ? "success" : "error",
      messages: [forgetPassword.message ?? "Reset password email sent."],
    } as Result;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      messages: ["Please try again with a valid email address."],
    } as Result;
  }
}
