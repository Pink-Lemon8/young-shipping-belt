import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues, beltQueuePharmacistReview, user } from "@/db/schema";
import { and, count, eq, inArray, isNotNull, isNull, like, or, desc, asc } from "drizzle-orm";

export const schema = {
  beltCode: z.string().optional().describe("Filter by belt code: A, B, C, or D"),
  status: z
    .array(z.enum(["SENT_TO_BELT", "STAGE1", "STAGE2", "STAGE3", "COMPLETED", "FAILED"]))
    .optional()
    .describe("Filter by queue status"),
  search: z.string().optional().describe("Search by order ID, patient ID, or tracking number"),
  skipped: z.boolean().optional().describe("Filter skipped orders only"),
  limit: z.number().default(25).describe("Max results (default 25, max 100)"),
  page: z.number().default(1).describe("Page number (default 1)"),
};

export const metadata = {
  name: "get-belt-queue",
  description:
    "List belt queue items by belt code, status, search term, skipped flag. Returns queue entries with affiliate, box size, locked user info.",
  annotations: {
    title: "Get Belt Queue",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getBeltQueue(params: InferSchema<typeof schema>) {
  const { beltCode, status, search, skipped, limit = 25, page = 1 } = params;
  const effectiveLimit = Math.min(limit, 100);
  const offset = (page - 1) * effectiveLimit;
  const conditions: any[] = [];

  if (beltCode) conditions.push(eq(beltQueues.beltCode, beltCode.charAt(0)));
  if (status?.length) conditions.push(inArray(beltQueues.status, status));
  if (search) {
    conditions.push(
      or(
        like(beltQueues.orderId, `%${search}%`),
        like(beltQueues.patientId, `%${search}%`),
        like(beltQueues.trackingNumber, `%${search}%`)
      )
    );
  }
  if (skipped !== undefined) conditions.push(eq(beltQueues.skipped, skipped));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalCount] = await Promise.all([
    db.query.beltQueues.findMany({
      where: whereClause,
      with: {
        BoxSize: { columns: { id: true, name: true, type: true } },
        Affiliate: { columns: { id: true, name: true, code: true, pwAuthPassword: false, pwAuthUsername: false, pwLocal: false } },
        LockedForBeltUser: { columns: { id: true, name: true, email: true } },
        SkippedBy: { columns: { id: true, name: true } },
      },
      limit: effectiveLimit,
      offset,
      orderBy: (q, { desc }) => [desc(q.labelCreatedAt)],
    }),
    db.select({ count: count() }).from(beltQueues).where(whereClause),
  ]);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ queue: rows, page, limit: effectiveLimit, total: totalCount[0]?.count ?? 0 }, null, 2),
      },
    ],
  };
}
