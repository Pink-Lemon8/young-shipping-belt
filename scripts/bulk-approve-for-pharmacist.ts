import { db } from "../src/db/db";
import { beltQueues, beltQueuePharmacistReview } from "../src/db/schema";
import { and, inArray, lt, notInArray, sql } from "drizzle-orm";

const PHARMACIST_USER_ID = "C7vk2dTQ3o5AgpXoCPh983FBwnBBzqh4";
// 8PM CST Dec 29 = 2AM UTC Dec 30
const CUTOFF_DATE = "2026-02-25 08:00:00";

async function main() {
  console.log(`Bulk approving orders for pharmacist: ${PHARMACIST_USER_ID}`);
  console.log(`Cutoff: before ${CUTOFF_DATE} UTC (8PM CST Jan 1)\n`);

  // Get orders already reviewed by this pharmacist
  const alreadyReviewed = await db
    .select({ orderId: beltQueuePharmacistReview.orderId })
    .from(beltQueuePharmacistReview)
    .where(
      sql`${beltQueuePharmacistReview.pharmacistId} = ${PHARMACIST_USER_ID}`,
    );

  const reviewedOrderIds = alreadyReviewed.map((r) => r.orderId);
  console.log(
    `Already reviewed by this pharmacist: ${reviewedOrderIds.length}`,
  );

  // Find orders in review-eligible statuses before cutoff
  const ordersToApprove = await db
    .select({ orderId: beltQueues.orderId, updatedAt: beltQueues.updatedAt })
    .from(beltQueues)
    .where(
      and(
        inArray(beltQueues.status, ["STAGE2", "STAGE3", "COMPLETED"]),
        lt(beltQueues.updatedAt, new Date(CUTOFF_DATE)),
        reviewedOrderIds.length > 0
          ? notInArray(beltQueues.orderId, reviewedOrderIds)
          : undefined,
      ),
    );

  console.log(`Orders to bulk approve: ${ordersToApprove.length}\n`);

  if (ordersToApprove.length === 0) {
    console.log("Nothing to approve!");
    process.exit(0);
  }

  // Insert approval records
  const approvalRecords = ordersToApprove.map((order) => ({
    orderId: order.orderId,
    pharmacistId: PHARMACIST_USER_ID,
    status: "APPROVED" as const,
    reason: "Bulk approved - historical orders before pharmacist start date",
  }));

  const result = await db
    .insert(beltQueuePharmacistReview)
    .values(approvalRecords)
    .execute();

  console.log(`✓ Inserted ${result[0].affectedRows} approval records`);
  console.log("Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
