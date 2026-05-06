"use server";
import { z } from "zod";
import { Result } from "@/lib/types";
import { authClient } from "@/lib/auth/auth-client";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export async function register(
  prevState: Result | undefined,
  formData: FormData
) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    const validation = authSchema.safeParse({ email, password, name });

    if (!validation.success) {
      return {
        status: "error",
        messages: ["Please enter a valid email address and password"],
        errors: [
          {
            code: "INVALID_INPUT",
            message: "Please enter a valid email address and password",
          },
        ],
      } as Result;
    }

    const signUpResult: any = await authClient.signUp.email({
      email: validation.data.email,
      password: validation.data.password,
      name: validation.data.name,
      // phoneNumber: undefined,
      // language: "en-US",
      // timezone: "UTC",
      // timeFormat: "dd MMM yyyy, hh:mm a",
      // bio: undefined,
    });

    if (signUpResult.error || !signUpResult.data)
      return {
        status: "error",
        messages: [signUpResult.error?.message ?? "Signup failed"],
        errors: [
          {
            code: "SIGNUP_FAILED",
            message: signUpResult.error?.message || "Signup failed",
          },
        ],
      } as Result;

    return { status: "success" } as Result;
  } catch (error) {
    return {
      status: "error",
      messages: ["An unknown error occurred. Please try again later."],
      errors: [{ code: "FATAL_ERROR", message: "Fatal error" }],
    } as Result;
  }
}
