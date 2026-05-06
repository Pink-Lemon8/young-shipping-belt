import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues, beltQueuePharmacistReview, user, logs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const schema = {
  orderId: z.string().describe("Order ID to look up"),
};

export const metadata = {
  name: "get-order-belt-status",
  description:
    "Quick lookup: where is a specific order in the belt workflow? Returns current stage, belt code, who has it locked, skip status, pharmacist review result, cage assignment.",
  annotations: {
    title: "Order Belt Status",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getOrderBeltStatus(params: InferSchema<typeof schema>) {
  const { orderId } = params;

  const queueItem = await db.query.beltQueues.findFirst({
    where: (q, { eq }) => eq(q.orderId, orderId),
    with: {
      LockedForBeltUser: { columns: { id: true, name: true } },
      SkippedBy: { columns: { id: true, name: true } },
      Affiliate: { columns: { id: true, name: true, code: true, pwAuthPassword: false, pwAuthUsername: false, pwLocal: false } },
    },
  });

  if (!queueItem) {
    return { content: [{ type: "text", text: `Order "${orderId}" not found in belt queue.` }] };
  }

  const reviews = await db
    .select({
      status: beltQueuePharmacistReview.status,
      reason: beltQueuePharmacistReview.reason,
      pharmacistName: user.name,
      createdAt: beltQueuePharmacistReview.createdAt,
    })
    .from(beltQueuePharmacistReview)
    .leftJoin(user, eq(beltQueuePharmacistReview.pharmacistId, user.id))
    .where(eq(beltQueuePharmacistReview.orderId, orderId));

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            orderId: queueItem.orderId,
            status: queueItem.status,
            beltCode: queueItem.beltCode,
            cageCode: queueItem.cageCode,
            skipped: queueItem.skipped,
            skippedBy: queueItem.SkippedBy,
            skippedAt: queueItem.skippedAt,
            lockedBy: queueItem.LockedForBeltUser,
            lockedAt: queueItem.lockedAt,
            affiliate: queueItem.Affiliate,
            shippedAt: queueItem.shippedAt,
            trackingNumber: queueItem.trackingNumber,
            shippingMethod: queueItem.shippingMethod,
            pharmacistReviews: reviews,
          },
          null,
          2
        ),
      },
    ],
  };
}
