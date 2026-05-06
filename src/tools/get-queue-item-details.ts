import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues, beltQueuePharmacistReview, orderItems, orderExpectedItems, user, logs } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export const schema = {
  orderId: z.string().describe("The order ID to look up"),
  includeLogs: z.boolean().default(false).describe("Include belt processing logs"),
  includeItems: z.boolean().default(true).describe("Include scanned order items"),
  includeExpectedItems: z.boolean().default(false).describe("Include expected items from PharmacyWire"),
};

export const metadata = {
  name: "get-queue-item-details",
  description:
    "Get full details for a single belt queue entry: all stage data, photos, items, expected items, box size, affiliate, pharmacist review, cage assignment, lock state, and optional logs.",
  annotations: {
    title: "Get Queue Item Details",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getQueueItemDetails(params: InferSchema<typeof schema>) {
  const { orderId, includeLogs = false, includeItems = true, includeExpectedItems = false } = params;

  const queueItem = await db.query.beltQueues.findFirst({
    where: (q, { eq }) => eq(q.orderId, orderId),
    with: {
      BoxSize: true,
      Affiliate: { columns: { id: true, name: true, code: true, category: true, pwAuthPassword: false, pwAuthUsername: false } },
      LockedForBeltUser: { columns: { id: true, name: true, email: true } },
      SkippedBy: { columns: { id: true, name: true } },
    },
  });

  if (!queueItem) {
    return { content: [{ type: "text", text: `Order "${orderId}" not found in belt queue.` }] };
  }

  const result: any = { ...queueItem };

  const reviews = await db
    .select({
      orderId: beltQueuePharmacistReview.orderId,
      status: beltQueuePharmacistReview.status,
      reason: beltQueuePharmacistReview.reason,
      pharmacistName: user.name,
      pharmacistEmail: user.email,
      createdAt: beltQueuePharmacistReview.createdAt,
      updatedAt: beltQueuePharmacistReview.updatedAt,
    })
    .from(beltQueuePharmacistReview)
    .leftJoin(user, eq(beltQueuePharmacistReview.pharmacistId, user.id))
    .where(eq(beltQueuePharmacistReview.orderId, orderId));

  result.pharmacistReviews = reviews;

  const promises: Promise<any>[] = [];

  if (includeItems) {
    promises.push(
      db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).then((items) => {
        result.items = items;
      })
    );
  }

  if (includeExpectedItems) {
    promises.push(
      db.select().from(orderExpectedItems).where(eq(orderExpectedItems.orderId, orderId)).then((items) => {
        result.expectedItems = items;
      })
    );
  }

  if (includeLogs) {
    promises.push(
      db.query.logs.findMany({
        where: (l, { eq }) => eq(l.orderId, orderId),
        with: { User: { columns: { id: true, name: true } } },
        orderBy: [desc(logs.createdAt)],
        limit: 50,
      }).then((logEntries) => {
        result.logs = logEntries;
      })
    );
  }

  await Promise.all(promises);

  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
}
