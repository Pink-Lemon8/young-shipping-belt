"use server";
import { db } from "@/db/db";
import { logs, user, verification } from "@/db/schema";
import { Result } from "@/lib/types";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function ForgetPasswordCreateNewAction(
  code: string,
  password: string
) {
  try {
    const clientIp = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    const [userData] = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      .from(verification)
      .leftJoin(user, eq(verification.value, user.id))
      .where(eq(verification.identifier, `reset-password:${code}`));

    const resetPassword: any = await auth.api.resetPassword({
      headers: await headers(),
      body: {
        token: code,
        newPassword: password,
      },
    });

    try {
      const createLog = await db.insert(logs).values({
        userId: userData?.id?.toString(),
        action: "FORGOT_PASSWORD_CREATED_NEW",
        description:
          `User ${userData?.email} created a new password by ip -> ` + clientIp,
      });
    } catch (error) {
      console.log(error);
    }

    return {
      status: resetPassword.status ? "success" : "error",
      messages: [resetPassword.message ?? "Password has been changed."],
    } as Result;
  } catch (error) {
    return {
      status: "error",
      messages: [
        (error as Error).message ??
          "Unknow error occurred. Please try again later.",
      ],
    } as Result;
  }
}
