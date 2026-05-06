import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { users, user } from "@/db/schema";

export const schema = {
  role: z.string().optional().describe("Filter by role: ADMIN, COORDINATOR, PHARMACIST, BELT"),
  status: z.string().optional().describe("Filter by status: PENDING, ACTIVE, INACTIVE, SUSPENDED"),
  source: z.enum(["legacy", "auth", "both"]).default("both").describe("Which user table to query"),
};

export const metadata = {
  name: "get-belt-users",
  description:
    "List belt system users with assigned belt codes, roles, kicker counts, status. Queries legacy belt_users table and/or better-auth user table.",
  annotations: {
    title: "Get Belt Users",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getBeltUsers(params: InferSchema<typeof schema>) {
  const { role, status, source = "both" } = params;
  const result: any = {};

  if (source === "legacy" || source === "both") {
    const legacyUsers = await db.query.users.findMany({
      where: (u, { and, eq }) =>
        and(
          role ? eq(u.role, role as any) : undefined,
          status ? eq(u.status, status as any) : undefined
        ),
      columns: { password: false },
      orderBy: (u, { desc }) => [desc(u.createdAt)],
    });
    result.legacyUsers = legacyUsers;
  }

  if (source === "auth" || source === "both") {
    const authUsers = await db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        banned: true,
        beltCode: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: (u, { desc }) => [desc(u.createdAt)],
    });
    result.authUsers = authUsers;
  }

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}
