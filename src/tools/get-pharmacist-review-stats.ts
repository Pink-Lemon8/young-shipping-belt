import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueuePharmacistReview, user } from "@/db/schema";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";

export const schema = {
  startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
};

export const metadata = {
  name: "get-pharmacist-review-stats",
  description:
    "Get pharmacist review statistics: approval/denial rates overall and per pharmacist, volume by time period.",
  annotations: {
    title: "Pharmacist Review Stats",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getPharmacistReviewStats(params: InferSchema<typeof schema>) {
  const { startDate, endDate } = params;
  const conditions: any[] = [];

  if (startDate) conditions.push(gte(beltQueuePharmacistReview.createdAt, new Date(startDate)));
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(beltQueuePharmacistReview.createdAt, end));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [overall, byPharmacist] = await Promise.all([
    db
      .select({ status: beltQueuePharmacistReview.status, count: count() })
      .from(beltQueuePharmacistReview)
      .where(whereClause)
      .groupBy(beltQueuePharmacistReview.status),
    db
      .select({
        pharmacistId: beltQueuePharmacistReview.pharmacistId,
        pharmacistName: user.name,
        status: beltQueuePharmacistReview.status,
        count: count(),
      })
      .from(beltQueuePharmacistReview)
      .leftJoin(user, eq(beltQueuePharmacistReview.pharmacistId, user.id))
      .where(whereClause)
      .groupBy(beltQueuePharmacistReview.pharmacistId, user.name, beltQueuePharmacistReview.status),
  ]);

  const totalReviews = overall.reduce((sum, s) => sum + s.count, 0);
  const approved = overall.find((s) => s.status === "APPROVED")?.count ?? 0;
  const denied = overall.find((s) => s.status === "DENIED")?.count ?? 0;
  const pending = overall.find((s) => s.status === "PENDING")?.count ?? 0;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            overall: {
              total: totalReviews,
              approved,
              denied,
              pending,
              approvalRate: totalReviews > 0 ? ((approved / (approved + denied)) * 100).toFixed(1) + "%" : "N/A",
            },
            byPharmacist,
          },
          null,
          2
        ),
      },
    ],
  };
}
