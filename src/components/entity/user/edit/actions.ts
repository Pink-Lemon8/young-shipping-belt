"use server";
import { db } from "@/db/db";
import { logs, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Result } from "@/lib/types";
import { eq, and, not } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { userRoles } from "@/lib/auth/roles-and-permissions";
import { Error } from "@/lib/types";
import { isUserRoleLevelAllowed } from "@/lib/auth/utils/helpers";
const editUserSchema = z.object({
  userId: z
    .string({ message: "User ID is required" })
    .min(15, "User ID is required")
    .max(36, "User ID must be 36 characters long"),
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
    .max(150, "Password must be less than 150 characters")
    .optional(),
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

export async function edit(prevState: Result | undefined, formData: FormData) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user)
      return {
        status: "error",
        errors: [
          {
            code: "UNAUTHORIZED",
            message: "You are not authorized",
          },
        ],
      } as Result;

    const canDo = await auth.api.userHasPermission({
      headers: await headers(),
      body: {
        userId: authentication?.user.id,
        permission: {
          user: ["update"],
        },
      },
    });

    if (canDo === undefined || canDo?.success === false)
      return {
        status: "error",
        errors: [
          {
            code: "UNAUTHORIZED",
            message: "You are not authorized to update a user",
          },
        ],
      } as Result;

    const validation = editUserSchema.safeParse({
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

    const errors: Error[] = [];

    const [userInfo] = await db
      .select()
      .from(user)
      .where(eq(user.id, validation.data.userId));

    if (!isUserRoleLevelAllowed(authentication?.user?.role, userInfo?.role))
      return {
        status: "error",
        errors: [
          {
            code: "UNAUTHORIZED",
            message: `You are not authorized to update a user with role: ${userInfo?.role}`,
          },
        ],
      } as Result;

    // Update user email
    if (userInfo && userInfo.email !== validation.data.email)
      try {
        const checkNewEmail = await db
          .select({ id: user.id })
          .from(user)
          .where(
            and(
              eq(user.email, validation.data.email),
              not(eq(user.id, userInfo.id))
            )
          );

        if (checkNewEmail.length > 0) {
          errors.push({
            code: "EMAIL_ALREADY_EXISTS",
            field: "email",
            message: "Email already exists",
          } as Error);
        } else {
          const updatedUserEmail = await db
            .update(user)
            .set({
              email: validation.data.email,
            })
            .where(
              and(
                eq(user.id, validation.data.userId),
                eq(user.email, userInfo.email)
              )
            )
            .execute();

          try {
            await db.insert(logs).values({
              userId: validation.data.userId.toString(),
              action: "UPDATE_USER_EMAIL",
              description: `User ${validation.data.name} updated by ${authentication?.user.name}`,
            });
          } catch (error) {
            console.error(error);
          }
        }
      } catch (error) {
        console.error(error);
        errors.push({
          code: "INTERNAL_SERVER_ERROR",
          field: "email",
          message: "Failed to update user email",
        } as Error);
      }
    // Update user name
    if (userInfo?.name !== validation.data.name)
      try {
        const updatedUserName = await db
          .update(user)
          .set({
            name: validation.data.name,
          })
          .where(eq(user.id, validation.data.userId))
          .execute();

        try {
          await db.insert(logs).values({
            userId: validation.data.userId.toString(),
            action: "UPDATE_USER_NAME",
            description: `User ${userInfo?.name} updated by ${authentication?.user.name}`,
          });
        } catch (error) {
          console.error(error);
        }
      } catch (error: any) {
        const errorMessage = error.body ?? {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user name",
        };
        errors.push({
          code: errorMessage.code,
          field: "name",
          message: errorMessage.message,
        } as Error);
      }

    // Update user role
    if (userInfo?.role !== validation.data.role)
      try {
        const updatedUserRole = await auth.api.setRole({
          headers: await headers(),
          body: {
            userId: validation.data.userId,
            role: validation.data.role as any,
          },
        });

        try {
          await db.insert(logs).values({
            userId: validation.data.userId.toString(),
            action: "UPDATE_USER_ROLE",
            description: `User ${validation.data.name} updated by ${authentication?.user.name}`,
          });
        } catch (error) {
          console.error(error);
        }
      } catch (error: any) {
        const errorMessage = error.body ?? {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user role",
        };
        errors.push({
          code: errorMessage.code,
          field: "role",
          message: errorMessage.message,
        } as Error);
      }

    // Update user password
    const checkPasswordChange =
      (validation.data.password?.replaceAll("**********", "")?.length ?? 0) > 0;
    if (checkPasswordChange && validation.data.password)
      try {
        const updatedUserPassword = await auth.api.setUserPassword({
          headers: await headers(),
          body: {
            userId: validation.data.userId,
            newPassword: validation.data.password,
          },
        });

        try {
          await db.insert(logs).values({
            userId: validation.data.userId.toString(),
            action: "UPDATE_USER_PASSWORD",
            description: `User ${validation.data.name} updated by ${authentication?.user.name}`,
          });
        } catch (error) {
          console.error(error);
        }
      } catch (error: any) {
        const errorMessage = error.body ?? {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add user",
        };
        errors.push({
          code: errorMessage.code,
          field: "password",
          message: errorMessage.message,
        } as Error);
      }

    await db
      .update(user)
      .set({
        department: validation.data.department,
        affiliates: validation.data.affiliates,
        beltCode: validation.data.beltCode,
      })
      .where(eq(user.id, validation.data.userId));

    if (errors.length > 0)
      return {
        status: "error",
        errors: errors,
      } as Result;

    const updatedUser = await auth.api.listUsers({
      headers: await headers(),
      query: {
        limit: 1,
        offset: 0,
        searchField: "email",
        searchValue: validation.data.email,
      },
    });

    return {
      status: "success",
      message: "User updated successfully",
      value: updatedUser.users[0],
    } as Result;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      errors: [
        {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user",
        },
      ],
    } as Result;
  }
}
