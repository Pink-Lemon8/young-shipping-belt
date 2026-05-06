"use server";
import { db } from "@/db/db";
import { logs, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Result } from "@/lib/types";
import { headers } from "next/headers";
import { z } from "zod";
import { userRoles } from "@/lib/auth/roles-and-permissions";
import { isUserRoleLevelAllowed } from "@/lib/auth/utils/helpers";
import { eq } from "drizzle-orm";

const addUserSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(1, "Name is required")
    .max(150, "Name must be less than 150 characters"),
  email: z
    .string({ message: "Email is required" })
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email is not valid")
    .min(1, "Email is required")
    .max(150, "Email must be less than 150 characters"),
  department: z
    .string({ message: "Department is required" })
    .max(225, "Department must be less than 225 characters")
    .transform((val) => (val.trim() === "" ? null : val.trim())),
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(150, "Password must be less than 150 characters"),
  role: z
    .enum(Object.keys(userRoles) as [string, ...string[]], {
      message: "Role is not valid",
    })
    .default("regular"),
  affiliates: z
    .string({ message: "Affiliates is required" })
    .max(255, "Affiliates must be less than 255 characters")
    .transform((val) => (val.trim() === "" ? null : val.trim())),
  beltCode: z
    .string({ message: "Belt Code is required" })
    .max(3, "Belt Code must be less than 3 characters")
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),
});

export async function add(prevState: Result | undefined, formData: FormData) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user)
      return {
        status: "error",
        errors: [
          {
            field: "UNAUTHORIZED",
            message: "You are not authorized",
          },
        ],
      } as Result;

    const canDo = await auth.api.userHasPermission({
      headers: await headers(),
      body: {
        userId: authentication?.user.id,
        permission: {
          user: ["create"],
        },
      },
    });

    if (canDo === undefined || canDo?.success === false)
      return {
        status: "error",
        errors: [
          {
            field: "UNAUTHORIZED",
            message: "You are not authorized to add a user",
          },
        ],
      } as Result;

    const validation = addUserSchema.safeParse({
      ...Object.fromEntries(formData),
    });

    if (!validation.success) {
      return {
        status: "error",
        errors: validation.error?.issues.map((error) => ({
          code: error.code ?? "VALIDATION_ERROR",
          field: error.path?.[0],
          message: error.message,
        })),
      } as Result;
    }
    if (
      !isUserRoleLevelAllowed(authentication?.user?.role, validation.data.role)
    )
      return {
        status: "error",
        errors: [
          {
            field: "UNAUTHORIZED",
            message: `You are not authorized to add a user with role: ${validation.data.role}`,
          },
        ],
      } as Result;

    try {
      const newUser = await auth.api.createUser({
        headers: await headers(),
        body: {
          name: validation.data.name,
          email: validation.data.email,
          password: validation.data.password,
          role: validation.data.role as any,
        },
      });

      await db
        .update(user)
        .set({
          department: validation.data.department,
          affiliates: validation.data.affiliates,
          beltCode: validation.data.beltCode,
        })
        .where(eq(user.id, newUser.user.id));

      try {
        await db.insert(logs).values({
          userId: newUser.user.id,
          action: "CREATE_USER",
          description: `User ${newUser.user.name} created by ${authentication?.user.name}`,
        });
      } catch (error) {
        console.error(error);
      }

      return {
        status: "success",
        value: newUser.user,
      } as Result;
    } catch (error: any) {
      const errorMessage = error.body ?? {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add user",
      };
      return {
        status: "error",
        errors: [
          {
            field: errorMessage.code,
            message: errorMessage.message,
          },
        ],
      } as Result;
    }
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      errors: [
        {
          field: "INTERNAL_SERVER_ERROR",
          message: "Failed to add user",
        },
      ],
    } as Result;
  }
}
