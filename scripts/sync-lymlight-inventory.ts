import { db } from "../src/db/db";
import { beltQueues, orderItems } from "../src/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";

const LYMLIGHT_URL = process.env.APP_ENV === "production" 
  ? "https://lymlight.com" 
  : "http://localhost:3000";
const LYMLIGHT_API_AUTH = process.env.LYMLIGHT_API_AUTH;
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1465626107016515677/-7y3AQqQazzMVmHJFs_HzndJWqjRGDEi97qNttFWVg_V9jj-o1dISXTxjGw7qb7mOtRK";

async function sendDiscordAlert(packageId: string, error: string, stockChange: number) {
  try {
    const message = {
      embeds: [{
        title: "⚠️ Inventory Sync Failed",
        color: 0xff0000,
        fields: [
          { name: "Package ID", value: packageId, inline: true },
          { name: "Attempted Change", value: `${stockChange}`, inline: true },
          { name: "Error", value: error },
        ],
        timestamp: new Date().toISOString(),
      }]
    };
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.log("Failed to send Discord alert:", e);
  }
}

// Orders completed after this date need inventory sync
const CUTOFF_DATE = "2026-01-24 04:00:00";

// Set to true to actually update inventory, false for dry run
const DRY_RUN = false;

// Only process DP- items (PP- already done)
const ONLY_DP_ITEMS = true;

// Only retry these failed items
const ONLY_THESE_ITEMS = [
  "DP-17612", "DP-17372", "DP-16595", "DP-17614", "DP-17119",
  "DP-17437", "DP-12475", "DP-10830", "DP-17172", "DP-17068",
  "DP-3129", "DP-6726", "DP-16594", "DP-3098", "DP-1190",
  "DP-9801", "DP-9795", "DP-17438", "DP-16853"
];

interface InventoryUpdate {
  packageId: string;
  quantity: number;
  orderId: string;
}

async function updateLymlightInventory(
  packageId: string,
  stockChange: number
): Promise<{ success: boolean; error?: string }> {
  let body: { id?: number; legacyId?: string; stockChange: number };

  if (packageId.startsWith("PP-")) {
    const id = parseInt(packageId.replace("PP-", ""), 10);
    body = { id, stockChange };
  } else if (packageId.startsWith("DP-")) {
    body = { legacyId: packageId, stockChange };
  } else {
    return { success: false, error: `Unknown package ID format: ${packageId}` };
  }

  try {
    const response = await fetch(
      `${LYMLIGHT_URL}/api/belt/inventory/update?AUTH=${LYMLIGHT_API_AUTH}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      // Send Discord alert for inventory sync failures
      if (errorData.includes("not found") || errorData.includes("Insufficient stock")) {
        await sendDiscordAlert(packageId, errorData, stockChange);
      }
      return { success: false, error: errorData };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function main() {
  console.log("===========================================");
  console.log("  Lymlight Inventory Sync Script");
  console.log("===========================================\n");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE - WILL UPDATE INVENTORY"}`);
  console.log(`Cutoff date: ${CUTOFF_DATE} UTC`);
  console.log(`Lymlight URL: ${LYMLIGHT_URL}\n`);

  if (!LYMLIGHT_API_AUTH) {
    console.error("ERROR: LYMLIGHT_API_AUTH env var not set!");
    process.exit(1);
  }

  // Get all orders completed after cutoff date
  const completedOrders = await db
    .select({
      orderId: beltQueues.orderId,
      updatedAt: beltQueues.updatedAt,
      cageCode: beltQueues.cageCode,
    })
    .from(beltQueues)
    .where(
      and(
        eq(beltQueues.status, "COMPLETED"),
        gte(beltQueues.updatedAt, new Date(CUTOFF_DATE))
      )
    );

  console.log(`Found ${completedOrders.length} orders completed after cutoff\n`);

  if (completedOrders.length === 0) {
    console.log("Nothing to sync!");
    process.exit(0);
  }

  // Get all order items for these orders
  const orderIds = completedOrders.map((o) => o.orderId);
  const items = await db
    .select({
      orderId: orderItems.orderId,
      packageId: orderItems.packageId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  console.log(`Found ${items.length} line items to process\n`);

  // Aggregate by packageId
  const aggregated = new Map<string, { totalQty: number; orders: string[] }>();
  for (const item of items) {
    // Skip PP- items if ONLY_DP_ITEMS is true
    if (ONLY_DP_ITEMS && item.packageId.startsWith("PP-")) {
      continue;
    }
    // Skip items not in ONLY_THESE_ITEMS if set
    if (ONLY_THESE_ITEMS.length > 0 && !ONLY_THESE_ITEMS.includes(item.packageId)) {
      continue;
    }
    const existing = aggregated.get(item.packageId);
    if (existing) {
      existing.totalQty += item.quantity;
      existing.orders.push(item.orderId);
    } else {
      aggregated.set(item.packageId, {
        totalQty: item.quantity,
        orders: [item.orderId],
      });
    }
  }

  console.log("--- Aggregated inventory changes ---\n");
  console.log("PackageID\t\tTotal Qty\tOrders");
  console.log("-".repeat(60));

  for (const [packageId, data] of aggregated) {
    console.log(`${packageId}\t\t-${data.totalQty}\t\t${data.orders.length} orders`);
  }

  console.log("\n" + "-".repeat(60));
  console.log(`Total unique packages: ${aggregated.size}`);
  console.log(`Total quantity to reduce: ${Array.from(aggregated.values()).reduce((sum, d) => sum + d.totalQty, 0)}`);

  if (DRY_RUN) {
    console.log("\n*** DRY RUN - No changes made ***");
    console.log("Set DRY_RUN = false to apply changes");
    process.exit(0);
  }

  // Apply updates
  console.log("\n--- Applying inventory updates ---\n");

  let successCount = 0;
  let errorCount = 0;
  const errors: { packageId: string; error: string }[] = [];

  for (const [packageId, data] of aggregated) {
    const result = await updateLymlightInventory(packageId, -data.totalQty);
    if (result.success) {
      successCount++;
      console.log(`✓ ${packageId}: -${data.totalQty}`);
    } else {
      errorCount++;
      errors.push({ packageId, error: result.error || "Unknown error" });
      console.log(`✗ ${packageId}: ${result.error}`);
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("\n--- Summary ---");
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log("\nFailed updates:");
    for (const e of errors) {
      console.log(`  ${e.packageId}: ${e.error}`);
    }
  }

  console.log("\nDone!");
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
