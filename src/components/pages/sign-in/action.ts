"use server";
import { z } from "zod";
import { Result } from "@/lib/types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function authenticate(
  prevState: Result | undefined,
  formData: FormData
) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validation = authSchema.safeParse({ email, password });

    if (!validation.success) {
      return {
        status: "error",
        errors: [
          {
            code: "INVALID_INPUT",
            message: "Please enter a valid email address and password",
          },
        ],
      } as Result;
    }

    const signInEmailResult: any = await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email: validation.data.email,
        password: validation.data.password,
      },
    });

    if (
      signInEmailResult?.twoFactorRedirect !== undefined &&
      signInEmailResult?.twoFactorRedirect === true
    ) {
      return {
        status: "success",
        value: { twoFactorRedirect: true },
      } as Result;
    }

    return { status: "success" } as Result;
  } catch (error) {
    const errorMessage = error as { body: { message: string } };
    return {
      status: "error",
      errors: [
        {
          code: "UNKNOWN_ERROR",
          message: errorMessage?.body?.message ?? "Unknown error",
        },
      ],
    } as Result;
  }
}
