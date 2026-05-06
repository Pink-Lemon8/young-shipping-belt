import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues } from "@/db/schema";
import { and, eq, desc, count } from "drizzle-orm";

export const schema = {
  beltCode: z.string().optional().describe("Filter by belt code"),
  limit: z.number().default(50).describe("Max results (default 50)"),
  page: z.number().default(1).describe("Page number"),
};

export const metadata = {
  name: "get-skipped-orders",
  description:
    "List all skipped orders in the belt queue. Shows who skipped them, when, which belt, and current status.",
  annotations: {
    title: "Get Skipped Orders",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getSkippedOrders(params: InferSchema<typeof schema>) {
  const { beltCode, limit = 50, page = 1 } = params;
  const effectiveLimit = Math.min(limit, 100);
  const offset = (page - 1) * effectiveLimit;

  const condition = and(
    eq(beltQueues.skipped, true),
    beltCode ? eq(beltQueues.beltCode, beltCode.charAt(0)) : undefined
  );

  const [rows, totalCount] = await Promise.all([
    db.query.beltQueues.findMany({
      where: condition,
      with: {
        Affiliate: { columns: { id: true, name: true, code: true, pwAuthPassword: false, pwAuthUsername: false, pwLocal: false } },
        SkippedBy: { columns: { id: true, name: true, email: true } },
      },
      limit: effectiveLimit,
      offset,
      orderBy: (q, { desc }) => [desc(q.skippedAt)],
    }),
    db.select({ count: count() }).from(beltQueues).where(condition),
  ]);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ skippedOrders: rows, total: totalCount[0]?.count ?? 0, page }, null, 2),
      },
    ],
  };
}
