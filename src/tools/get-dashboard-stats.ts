import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues, affiliates, users, logs } from "@/db/schema";
import { and, count, desc, eq, gte, isNotNull, lte, or, sql } from "drizzle-orm";

export const schema = {};

export const metadata = {
  name: "get-dashboard-stats",
  description:
    "Get the full belt dashboard: stage counts, today/yesterday/weekly/monthly completions with trends, pharmacist approvals/denials, cage distribution, belt performance, affiliate breakdown, skipped counts, avg processing time.",
  annotations: {
    title: "Belt Dashboard Stats",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getDashboardStats(_params: InferSchema<typeof schema>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    stageCounts,
    todayCompleted,
    yesterdayCompleted,
    weeklyCompleted,
    monthlyCompleted,
    todaySkipped,
    totalSkipped,
    cageDistribution,
    beltPerformance,
    affiliateStats,
    avgProcessingTime,
  ] = await Promise.all([
    db.select({ status: beltQueues.status, count: count() }).from(beltQueues).groupBy(beltQueues.status),
    db.select({ count: count() }).from(beltQueues).where(and(eq(beltQueues.status, "COMPLETED"), sql`DATE(${beltQueues.shippedAt}) = ${today.toISOString().split("T")[0]}`)),
    db.select({ count: count() }).from(beltQueues).where(and(eq(beltQueues.status, "COMPLETED"), sql`DATE(${beltQueues.shippedAt}) = ${yesterday.toISOString().split("T")[0]}`)),
    db.select({ count: count() }).from(beltQueues).where(and(eq(beltQueues.status, "COMPLETED"), gte(beltQueues.shippedAt, sevenDaysAgo))),
    db.select({ count: count() }).from(beltQueues).where(and(eq(beltQueues.status, "COMPLETED"), gte(beltQueues.shippedAt, thirtyDaysAgo))),
    db.select({ count: count() }).from(beltQueues).where(and(eq(beltQueues.skipped, true), gte(beltQueues.createdAt, today))),
    db.select({ count: count() }).from(beltQueues).where(eq(beltQueues.skipped, true)),
    db.select({ cageCode: beltQueues.cageCode, count: sql<number>`COUNT(${beltQueues.cageCode})` }).from(beltQueues).where(and(isNotNull(beltQueues.cageCode), eq(beltQueues.status, "COMPLETED"))).groupBy(beltQueues.cageCode).orderBy(beltQueues.cageCode),
    db.select({ beltCode: beltQueues.beltCode, count: count() }).from(beltQueues).where(and(gte(beltQueues.shippedAt, today), isNotNull(beltQueues.beltCode), or(eq(beltQueues.status, "COMPLETED"), eq(beltQueues.status, "STAGE1"), eq(beltQueues.status, "STAGE2"), eq(beltQueues.status, "STAGE3"), eq(beltQueues.status, "FAILED")))).groupBy(beltQueues.beltCode).orderBy(desc(count())),
    db.select({ affiliateId: beltQueues.affiliateId, affiliateName: affiliates.name, count: count() }).from(beltQueues).leftJoin(affiliates, eq(beltQueues.affiliateId, affiliates.id)).where(gte(beltQueues.shippedAt, today)).groupBy(beltQueues.affiliateId).orderBy(desc(count())),
    db.select({ avgMinutes: sql<number>`AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at))` }).from(beltQueues).where(and(eq(beltQueues.status, "COMPLETED"), gte(beltQueues.shippedAt, today))),
  ]);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            stageCounts,
            today: todayCompleted[0]?.count ?? 0,
            yesterday: yesterdayCompleted[0]?.count ?? 0,
            weekly: weeklyCompleted[0]?.count ?? 0,
            monthly: monthlyCompleted[0]?.count ?? 0,
            todaySkipped: todaySkipped[0]?.count ?? 0,
            totalSkipped: totalSkipped[0]?.count ?? 0,
            cageDistribution,
            beltPerformance,
            affiliateStats,
            avgProcessingMinutes: avgProcessingTime[0]?.avgMinutes ? Math.round(Number(avgProcessingTime[0].avgMinutes)) : null,
          },
          null,
          2
        ),
      },
    ],
  };
}
