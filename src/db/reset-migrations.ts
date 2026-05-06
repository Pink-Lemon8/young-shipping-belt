import { db } from "@/db/db";
import { createHash } from "crypto";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import path from "path";
import migrationData from "./migrations/meta/_journal.json";

// Function to calculate MD5 hash of migration file content
function calculateMigrationHash(filePath: string): string {
  try {
    const content = readFileSync(filePath, "utf8");
    return createHash("md5").update(content).digest("hex");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    // Return a placeholder hash if file doesn't exist
    return createHash("md5")
      .update("-- Migration file not found")
      .digest("hex");
  }
}

// Function to add migrations to the database
export async function addMigrationsToDatabase() {
  try {
    console.log("🔄 Starting migration process...\n");

    // Check if migrations table exists and get current migrations
    const existingMigrations = await db.execute(
      sql`SELECT * FROM __drizzle_migrations ORDER BY id`
    );
    console.log(
      `📊 Current number of migrations: ${existingMigrations.length}`
    );

    // If there are already migrations, warn the user
    if (existingMigrations.length > 0) {
      console.log(
        "⚠️  Warning: Records already exist in __drizzle_migrations table!"
      );
      console.log(
        "This operation will delete existing records and recreate them."
      );

      // Clear existing migrations
      await db.execute(sql`DELETE FROM __drizzle_migrations`);
      console.log("🗑️  Existing migration records deleted.");
    }

    console.log("\n🔨 Adding migration records...");

    // Insert each migration
    for (const migration of migrationData.entries) {
      const migrationFilePath = path.join(
        "./src/db/migrations",
        `${migration.tag}.sql`
      );
      const hash = calculateMigrationHash(migrationFilePath);

      const insertQuery = `
        INSERT INTO __drizzle_migrations (id, hash, created_at) 
        VALUES (?, ?, ?)
      `;

      await db.execute(
        sql`INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES (${migration.idx + 1}, ${hash}, ${migration.when})`
      );

      console.log(
        `✅ Migration ${migration.idx + 1}: ${migration.tag} - ${hash.substring(0, 8)}...`
      );
    }

    console.log(
      `\n🎉 Total ${migrationData.entries.length} migrations successfully added!`
    );

    // Verify the insertions
    const finalCount: any = await db.execute(
      sql`SELECT COUNT(*) as count FROM __drizzle_migrations`
    );
    console.log(
      `📋 Verification: ${finalCount?.[0]?.[0]?.["count"] ?? "N/A"} records in __drizzle_migrations table.`
    );

    return true;
  } catch (error) {
    console.error("❌ Migration process failed:", error);
    throw error;
  }
}
