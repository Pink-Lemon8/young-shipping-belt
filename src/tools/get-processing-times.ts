import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues, affiliates } from "@/db/schema";
import { and, eq, gte, lte, sql, isNotNull } from "drizzle-orm";

export const schema = {
  startDate: z.string().optional().describe("Start date (YYYY-MM-DD), defaults to last 7 days"),
  endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
};

export const metadata = {
  name: "get-processing-times",
  description:
    "Average processing time from queue entry to completion, broken down by belt code and affiliate. Helps identify bottlenecks.",
  annotations: {
    title: "Processing Times",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getProcessingTimes(params: InferSchema<typeof schema>) {
  const { startDate, endDate } = params;

  const start = startDate ? new Date(startDate) : new Date();
  if (!startDate) start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const baseCondition = and(
    eq(beltQueues.status, "COMPLETED"),
    gte(beltQueues.shippedAt, start),
    lte(beltQueues.shippedAt, end),
    isNotNull(beltQueues.shippedAt)
  );

  const [overall, byBelt, byAffiliate] = await Promise.all([
    db
      .select({
        avgMinutes: sql<number>`AVG(TIMESTAMPDIFF(MINUTE, ${beltQueues.createdAt}, ${beltQueues.shippedAt}))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(beltQueues)
      .where(baseCondition),
    db
      .select({
        beltCode: beltQueues.beltCode,
        avgMinutes: sql<number>`AVG(TIMESTAMPDIFF(MINUTE, ${beltQueues.createdAt}, ${beltQueues.shippedAt}))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(beltQueues)
      .where(and(baseCondition, isNotNull(beltQueues.beltCode)))
      .groupBy(beltQueues.beltCode),
    db
      .select({
        affiliateId: beltQueues.affiliateId,
        affiliateName: affiliates.name,
        avgMinutes: sql<number>`AVG(TIMESTAMPDIFF(MINUTE, ${beltQueues.createdAt}, ${beltQueues.shippedAt}))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(beltQueues)
      .leftJoin(affiliates, eq(beltQueues.affiliateId, affiliates.id))
      .where(baseCondition)
      .groupBy(beltQueues.affiliateId),
  ]);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            overall: {
              avgMinutes: overall[0]?.avgMinutes ? Math.round(Number(overall[0].avgMinutes)) : null,
              count: overall[0]?.count ?? 0,
            },
            byBelt: byBelt.map((b) => ({ ...b, avgMinutes: Math.round(Number(b.avgMinutes)) })),
            byAffiliate: byAffiliate.map((a) => ({ ...a, avgMinutes: Math.round(Number(a.avgMinutes)) })),
          },
          null,
          2
        ),
      },
    ],
  };
}
