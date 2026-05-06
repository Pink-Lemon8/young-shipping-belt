import { readdir, readFile } from "fs/promises";
import { join, basename } from "path";
import { UTApi } from "uploadthing/server";
import { db } from "../src/db/db";
import { beltQueues } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

const utapi = new UTApi();
const UPLOAD_DIR = join(process.cwd(), "upload");

// Set to true to test without actually uploading
const DRY_RUN = process.argv.includes("--dry-run");

interface UploadResult {
  orderId: string;
  success: boolean;
  filesUploaded: number;
  error?: string;
}

async function uploadFilesForOrder(
  orderId: string,
  folderPath: string
): Promise<UploadResult> {
  try {
    console.log(`\n📦 Processing Order ID: ${orderId}`);

    // Check if order exists in database
    const orderExists = await db
      .select({ orderId: beltQueues.orderId })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId))
      .limit(1);

    if (orderExists.length === 0) {
      console.log(`  ⚠️  Order ${orderId} not found in database - SKIPPING`);
      return {
        orderId,
        success: false,
        filesUploaded: 0,
        error: "Order not found in database",
      };
    }

    // Get existing extraFiles
    const existingData = await db
      .select({
        extraFiles: beltQueues.extraFiles,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    const existingExtraFiles = existingData[0]?.extraFiles ?? [];

    // Read all files in the order folder
    const files = await readdir(folderPath);
    const pdfFiles = files.filter(
      (file) => file.endsWith(".pdf") && !file.startsWith(".")
    );

    if (pdfFiles.length === 0) {
      console.log(`  ℹ️  No PDF files found in folder - SKIPPING`);
      return {
        orderId,
        success: true,
        filesUploaded: 0,
        error: "No PDF files found",
      };
    }

    console.log(`  📄 Found ${pdfFiles.length} PDF file(s): ${pdfFiles.join(", ")}`);

    if (DRY_RUN) {
      console.log(`  🔍 DRY RUN: Would upload ${pdfFiles.length} files`);
      return {
        orderId,
        success: true,
        filesUploaded: pdfFiles.length,
      };
    }

    // Upload files to UploadThing
    const filesToUpload = await Promise.all(
      pdfFiles.map(async (filename) => {
        const filePath = join(folderPath, filename);
        const fileBuffer = await readFile(filePath);
        const file = new File([fileBuffer], filename, {
          type: "application/pdf",
        });
        return file;
      })
    );

    console.log(`  ⬆️  Uploading to UploadThing...`);
    const uploadResponse = await utapi.uploadFiles(filesToUpload);

    // Extract uploaded file data
    const uploadedFilesData = uploadResponse
      .map((response: any) => response.data)
      .filter((data: any) => data !== null && data !== undefined);

    if (uploadedFilesData.length === 0) {
      throw new Error("All file uploads failed");
    }

    console.log(`  ✅ Uploaded ${uploadedFilesData.length} file(s) to UploadThing`);

    // Update database with new files
    await db
      .update(beltQueues)
      .set({
        extraFiles: [
          ...(existingExtraFiles.filter((file: any) => file !== null) ?? []),
          ...uploadedFilesData,
        ],
        extraFilesCreatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(beltQueues.orderId, orderId))
      .execute();

    console.log(`  💾 Database updated successfully`);

    return {
      orderId,
      success: true,
      filesUploaded: uploadedFilesData.length,
    };
  } catch (error) {
    console.error(`  ❌ Error processing order ${orderId}:`, error);
    return {
      orderId,
      success: false,
      filesUploaded: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  console.log("🚀 Starting bulk file upload process...");
  console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
  console.log(`🔍 Mode: ${DRY_RUN ? "DRY RUN (no changes will be made)" : "LIVE"}\n`);

  try {
    // Read all directories in the upload folder
    const entries = await readdir(UPLOAD_DIR, { withFileTypes: true });
    const orderFolders = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name);

    console.log(`📊 Found ${orderFolders.length} order folder(s)\n`);

    if (orderFolders.length === 0) {
      console.log("No order folders found. Exiting.");
      return;
    }

    // Process each order folder
    const results: UploadResult[] = [];
    for (const orderId of orderFolders) {
      const folderPath = join(UPLOAD_DIR, orderId);
      const result = await uploadFilesForOrder(orderId, folderPath);
      results.push(result);
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 UPLOAD SUMMARY");
    console.log("=".repeat(60));

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const totalFilesUploaded = successful.reduce(
      (sum, r) => sum + r.filesUploaded,
      0
    );

    console.log(`✅ Successful: ${successful.length}/${results.length} orders`);
    console.log(`❌ Failed: ${failed.length}/${results.length} orders`);
    console.log(`📄 Total files uploaded: ${totalFilesUploaded}`);

    if (failed.length > 0) {
      console.log("\n❌ Failed orders:");
      failed.forEach((r) => {
        console.log(`  - Order ${r.orderId}: ${r.error}`);
      });
    }

    if (DRY_RUN) {
      console.log(
        "\n🔍 This was a DRY RUN. Run without --dry-run to actually upload files."
      );
    } else {
      console.log("\n✅ Upload process completed!");
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
