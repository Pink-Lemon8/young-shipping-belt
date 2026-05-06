"use server";

import { and, eq, inArray, not, or } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Result } from "@/lib/types";
import { db } from "@/db/db";
import { like, count } from "drizzle-orm";
import { user } from "@/db/schema";

export async function getUsers(
  filter:
    | {
        search?: string;
        roles?: string[];
      }
    | undefined = undefined,
  page: number = 1,
  limit: number = 10
) {
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
          user: ["list"],
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

    const [total] = await db
      .select({ count: count() })
      .from(user)
      .where(
        and(
          not(inArray(user.role, ["labelHelper", "pharmacy"])),
          or(
            filter?.search && filter.search.trim() !== ""
              ? like(user.id, `%${filter.search}%`)
              : undefined,
            filter?.search && filter.search.trim() !== ""
              ? like(user.name, `%${filter.search}%`)
              : undefined,
            filter?.search && filter.search.trim() !== ""
              ? like(user.email, `%${filter.search}%`)
              : undefined
          ),
          filter?.roles && filter.roles.length > 0
            ? inArray(user.role, filter.roles)
            : undefined
        )
      );

    const totalPage = Math.ceil(total.count / limit);

    const users = await db
      .select()
      .from(user)
      .where(
        and(
          not(inArray(user.role, ["labelHelper", "pharmacy"])),
          or(
            filter?.search && filter.search.trim() !== ""
              ? like(user.id, `%${filter.search}%`)
              : undefined,
            filter?.search && filter.search.trim() !== ""
              ? like(user.name, `%${filter.search}%`)
              : undefined,
            filter?.search && filter.search.trim() !== ""
              ? like(user.email, `%${filter.search}%`)
              : undefined
          ),
          filter?.roles && filter.roles.length > 0
            ? inArray(user.role, filter.roles)
            : undefined
        )
      )
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      status: "success",
      value: {
        users: users,
        total: total.count,
        currentPage: page,
        totalPages: totalPage,
      },
    } as Result;
  } catch (error) {
    return {
      status: "error",
      message: "Failed to get users",
    } as Result;
  }
}

export async function getUserBy({ id }: { id: string }) {
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
          user: ["view"],
        },
      },
    });

    if (canDo === undefined || canDo?.success === false)
      return {
        status: "error",
        errors: [
          {
            field: "UNAUTHORIZED",
            message: "You are not authorized to view a user",
          },
        ],
      } as Result;

    const getUserFromDB = await db
      .select()
      .from(user)
      .where(
        and(
          not(inArray(user.role, ["labelHelper", "pharmacy"])),
          eq(user.id, id)
        )
      );

    return {
      status: "success",
      value: {
        user: getUserFromDB,
      },
    } as Result;
  } catch (error) {
    return {
      status: "error",
      message: "Failed to get users",
    } as Result;
  }
}
