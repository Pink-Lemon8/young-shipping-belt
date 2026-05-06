import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues } from "@/db/schema";
import { and, count, eq, isNotNull, sql } from "drizzle-orm";

export const schema = {
  cageCode: z.string().optional().describe("Filter by specific cage code (1-12)"),
};

export const metadata = {
  name: "get-cage-status",
  description:
    "Get cage occupancy for shipping cages 1-12. Shows how many orders are in each cage.",
  annotations: {
    title: "Get Cage Status",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getCageStatus(params: InferSchema<typeof schema>) {
  const { cageCode } = params;

  if (cageCode) {
    const [result] = await db
      .select({ cageCode: beltQueues.cageCode, count: sql<number>`COUNT(${beltQueues.cageCode})` })
      .from(beltQueues)
      .where(and(eq(beltQueues.cageCode, cageCode), eq(beltQueues.status, "COMPLETED")))
      .groupBy(beltQueues.cageCode);

    return {
      content: [{ type: "text", text: JSON.stringify({ cage: cageCode, count: result?.count ?? 0 }, null, 2) }],
    };
  }

  const cages = await db
    .select({ cageCode: beltQueues.cageCode, count: sql<number>`COUNT(${beltQueues.cageCode})` })
    .from(beltQueues)
    .where(and(isNotNull(beltQueues.cageCode), eq(beltQueues.status, "COMPLETED")))
    .groupBy(beltQueues.cageCode)
    .orderBy(beltQueues.cageCode);

  return {
    content: [{ type: "text", text: JSON.stringify({ cages }, null, 2) }],
  };
}
