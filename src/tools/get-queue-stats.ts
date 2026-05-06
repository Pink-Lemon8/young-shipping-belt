import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues } from "@/db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";

export const schema = {
  beltCode: z.string().optional().describe("Filter by belt code: A, B, C, or D"),
};

export const metadata = {
  name: "get-queue-stats",
  description:
    "Get queue counts by status, by belt code, and by stage. Shows how many orders at each stage across all belts or a specific belt.",
  annotations: {
    title: "Get Queue Stats",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getQueueStats(params: InferSchema<typeof schema>) {
  const { beltCode } = params;

  const beltCondition = beltCode ? eq(beltQueues.beltCode, beltCode.charAt(0)) : undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [byStatus, byBelt, completedToday, skippedTotal] = await Promise.all([
    db
      .select({ status: beltQueues.status, count: count() })
      .from(beltQueues)
      .where(beltCondition)
      .groupBy(beltQueues.status),
    db
      .select({ beltCode: beltQueues.beltCode, status: beltQueues.status, count: count() })
      .from(beltQueues)
      .groupBy(beltQueues.beltCode, beltQueues.status)
      .orderBy(beltQueues.beltCode),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.status, "COMPLETED"),
          gte(beltQueues.shippedAt, today),
          beltCondition
        )
      ),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(and(eq(beltQueues.skipped, true), beltCondition)),
  ]);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            byStatus,
            byBelt,
            completedToday: completedToday[0]?.count ?? 0,
            skippedTotal: skippedTotal[0]?.count ?? 0,
          },
          null,
          2
        ),
      },
    ],
  };
}
