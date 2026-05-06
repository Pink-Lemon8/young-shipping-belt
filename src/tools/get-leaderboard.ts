import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { logs, user } from "@/db/schema";
import { and, count, eq, gte, lte, sql, desc, like } from "drizzle-orm";

export const schema = {
  period: z
    .enum(["today", "week", "month"])
    .default("today")
    .describe("Time period: today, week, or month"),
  stage: z
    .enum(["1", "2", "3", "all"])
    .default("all")
    .describe("Belt stage to rank by, or all stages combined"),
};

export const metadata = {
  name: "get-leaderboard",
  description:
    "Operator ranking/leaderboard: who pushed the most orders through belt stages. Filterable by time period and stage.",
  annotations: {
    title: "Belt Leaderboard",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getLeaderboard(params: InferSchema<typeof schema>) {
  const { period = "today", stage = "all" } = params;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(start.getDate() - 7);
  if (period === "month") start.setDate(start.getDate() - 30);

  const conditions: any[] = [gte(logs.createdAt, start)];

  if (stage !== "all") {
    conditions.push(like(logs.action, `%stage${stage}%`));
  } else {
    conditions.push(like(logs.action, `%stage%`));
  }

  const leaderboard = await db
    .select({
      userId: logs.userId,
      userName: user.name,
      beltCode: logs.beltCode,
      orderCount: sql<number>`COUNT(DISTINCT ${logs.orderId})`,
    })
    .from(logs)
    .leftJoin(user, eq(logs.userId, user.id))
    .where(and(...conditions))
    .groupBy(logs.userId, user.name, logs.beltCode)
    .orderBy(desc(sql`COUNT(DISTINCT ${logs.orderId})`));

  return {
    content: [{ type: "text", text: JSON.stringify({ leaderboard, period, stage }, null, 2) }],
  };
}
