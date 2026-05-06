import { readFile } from "fs/promises";
import { join } from "path";
import { db } from "../src/db/db";
import { affiliates } from "../src/db/schema";
import { eq } from "drizzle-orm";

const CSV_PATH = join(process.cwd(), "pwid.csv");

async function main() {
  const csvContent = await readFile(CSV_PATH, "utf-8");
  const lines = csvContent.trim().split("\n");
  
  // Skip header
  const dataLines = lines.slice(1);
  
  console.log(`Found ${dataLines.length} affiliates to update\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const line of dataLines) {
    const [id, name, code, pwAffiliateId] = line.split(",");
    
    try {
      await db
        .update(affiliates)
        .set({ pwAffiliateId: pwAffiliateId.trim() })
        .where(eq(affiliates.id, parseInt(id)));
      
      console.log(`✓ Updated affiliate ${id} (${code}) -> pw_affiliate_id: ${pwAffiliateId.trim()}`);
      updated++;
    } catch (err) {
      console.error(`✗ Failed to update affiliate ${id}: ${err}`);
      failed++;
    }
  }
  
  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
