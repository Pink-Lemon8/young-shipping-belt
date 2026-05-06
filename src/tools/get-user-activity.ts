import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { logs, user } from "@/db/schema";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";

export const schema = {
  userId: z.string().describe("User ID to look up activity for"),
  startDate: z.string().optional().describe("Start date (YYYY-MM-DD), defaults to today"),
  endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
};

export const metadata = {
  name: "get-user-activity",
  description:
    "Get a specific user's belt activity: orders processed per stage, action breakdown, timestamps. Daily detail for an operator.",
  annotations: {
    title: "Get User Activity",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getUserActivity(params: InferSchema<typeof schema>) {
  const { userId, startDate, endDate } = params;

  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const [actionSummary, recentLogs, userData] = await Promise.all([
    db
      .select({
        action: logs.action,
        count: sql<number>`COUNT(DISTINCT ${logs.orderId})`,
      })
      .from(logs)
      .where(and(eq(logs.userId, userId), gte(logs.createdAt, start), lte(logs.createdAt, end)))
      .groupBy(logs.action)
      .orderBy(desc(sql`COUNT(DISTINCT ${logs.orderId})`)),
    db.query.logs.findMany({
      where: (l, { and, eq, gte, lte }) =>
        and(eq(l.userId, userId), gte(l.createdAt, start), lte(l.createdAt, end)),
      orderBy: [desc(logs.createdAt)],
      limit: 100,
    }),
    db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
      columns: { id: true, name: true, email: true, role: true, beltCode: true },
    }),
  ]);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ user: userData, actionSummary, recentLogs, period: { start, end } }, null, 2),
      },
    ],
  };
}
