import { db } from "../src/db/db";
import { beltQueues } from "../src/db/schema";
import { and, eq, gte, isNull, sql } from "drizzle-orm";

// Backfill shippedAt for completed orders in February 2026
// Uses updatedAt as the ship date since that's when status changed to COMPLETED

const FEB_START = "2026-02-01 00:00:00";

async function main() {
  console.log("Backfilling shippedAt for COMPLETED orders in Feb 2026...\n");

  // Find completed orders from Feb 2026 without shippedAt
  const ordersToUpdate = await db
    .select({
      orderId: beltQueues.orderId,
      updatedAt: beltQueues.updatedAt,
    })
    .from(beltQueues)
    .where(
      and(
        eq(beltQueues.status, "COMPLETED"),
        gte(beltQueues.updatedAt, new Date(FEB_START)),
        isNull(beltQueues.shippedAt)
      )
    );

  console.log(`Found ${ordersToUpdate.length} orders to backfill\n`);

  if (ordersToUpdate.length === 0) {
    console.log("Nothing to backfill!");
    process.exit(0);
  }

  // Update each order's shippedAt to its updatedAt
  let updated = 0;
  for (const order of ordersToUpdate) {
    await db
      .update(beltQueues)
      .set({ shippedAt: order.updatedAt })
      .where(eq(beltQueues.orderId, order.orderId));
    updated++;
    if (updated % 100 === 0) {
      console.log(`Updated ${updated}/${ordersToUpdate.length}...`);
    }
  }

  console.log(`\n✓ Backfilled shippedAt for ${updated} orders`);
  console.log("Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
