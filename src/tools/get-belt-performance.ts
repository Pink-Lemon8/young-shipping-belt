import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { logs, user } from "@/db/schema";
import { and, count, eq, gte, lte, sql, desc } from "drizzle-orm";

export const schema = {
  startDate: z.string().optional().describe("Start date (YYYY-MM-DD), defaults to today"),
  endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
  userId: z.string().optional().describe("Filter by specific user ID"),
};

export const metadata = {
  name: "get-belt-performance",
  description:
    "Per-operator performance stats: orders pushed through each stage, daily counts. Shows who processed what and how much.",
  annotations: {
    title: "Belt Performance",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getBeltPerformance(params: InferSchema<typeof schema>) {
  const { startDate, endDate, userId } = params;

  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const conditions: any[] = [gte(logs.createdAt, start), lte(logs.createdAt, end)];
  if (userId) conditions.push(eq(logs.userId, userId));

  const performance = await db
    .select({
      userId: logs.userId,
      userName: user.name,
      action: logs.action,
      count: sql<number>`COUNT(DISTINCT ${logs.orderId})`,
    })
    .from(logs)
    .leftJoin(user, eq(logs.userId, user.id))
    .where(and(...conditions))
    .groupBy(logs.userId, user.name, logs.action)
    .orderBy(desc(sql`COUNT(DISTINCT ${logs.orderId})`));

  return {
    content: [{ type: "text", text: JSON.stringify({ performance, startDate: start.toISOString(), endDate: end.toISOString() }, null, 2) }],
  };
}
