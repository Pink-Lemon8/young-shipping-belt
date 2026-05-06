import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueuePharmacistReview, user } from "@/db/schema";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

export const schema = {
  status: z
    .array(z.enum(["PENDING", "APPROVED", "DENIED"]))
    .optional()
    .describe("Filter by review status"),
  pharmacistId: z.string().optional().describe("Filter by pharmacist user ID"),
  startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
  limit: z.number().default(50).describe("Max results (default 50)"),
  page: z.number().default(1).describe("Page number"),
};

export const metadata = {
  name: "get-pharmacist-reviews",
  description:
    "List pharmacist reviews with filters. Shows approval/denial status, reason, which pharmacist reviewed, and when.",
  annotations: {
    title: "Get Pharmacist Reviews",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getPharmacistReviews(params: InferSchema<typeof schema>) {
  const { status, pharmacistId, startDate, endDate, limit = 50, page = 1 } = params;
  const effectiveLimit = Math.min(limit, 100);
  const offset = (page - 1) * effectiveLimit;
  const conditions: any[] = [];

  if (status?.length) conditions.push(inArray(beltQueuePharmacistReview.status, status));
  if (pharmacistId) conditions.push(eq(beltQueuePharmacistReview.pharmacistId, pharmacistId));
  if (startDate) conditions.push(gte(beltQueuePharmacistReview.createdAt, new Date(startDate)));
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(beltQueuePharmacistReview.createdAt, end));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const reviews = await db
    .select({
      orderId: beltQueuePharmacistReview.orderId,
      status: beltQueuePharmacistReview.status,
      reason: beltQueuePharmacistReview.reason,
      pharmacistId: beltQueuePharmacistReview.pharmacistId,
      pharmacistName: user.name,
      pharmacistEmail: user.email,
      createdAt: beltQueuePharmacistReview.createdAt,
      updatedAt: beltQueuePharmacistReview.updatedAt,
    })
    .from(beltQueuePharmacistReview)
    .leftJoin(user, eq(beltQueuePharmacistReview.pharmacistId, user.id))
    .where(whereClause)
    .orderBy(desc(beltQueuePharmacistReview.createdAt))
    .limit(effectiveLimit)
    .offset(offset);

  return {
    content: [{ type: "text", text: JSON.stringify({ reviews, page, count: reviews.length }, null, 2) }],
  };
}
