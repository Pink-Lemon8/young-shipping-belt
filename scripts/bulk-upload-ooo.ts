import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";
import { UTApi } from "uploadthing/server";
import { db } from "../src/db/db";
import { beltQueues } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

const utapi = new UTApi();
const UPLOAD_DIR = join(process.cwd(), "ooo");
const DRY_RUN = process.argv.includes("--dry-run");
const ALLOWED_EXT = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

interface UploadResult {
  folder: string;
  orderId: string;
  success: boolean;
  filesUploaded: number;
  skipped: string[];
  error?: string;
}

function folderToOrderId(folder: string): string | null {
  const match = folder.match(/^order-(.+)$/i);
  if (!match) return null;
  return `LYM-${match[1]}`;
}

function guessMime(name: string): string {
  const ext = extname(name).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

async function uploadFilesForFolder(
  folder: string,
  folderPath: string,
): Promise<UploadResult> {
  const orderId = folderToOrderId(folder);
  if (!orderId) {
    return {
      folder,
      orderId: "",
      success: false,
      filesUploaded: 0,
      skipped: [],
      error: `Folder name does not match "order-<id>" pattern`,
    };
  }

  console.log(`\nProcessing ${folder} -> ${orderId}`);

  const exists = await db
    .select({ orderId: beltQueues.orderId })
    .from(beltQueues)
    .where(eq(beltQueues.orderId, orderId))
    .limit(1);

  if (exists.length === 0) {
    console.log(`  [skip] ${orderId} not found in belt_queues`);
    return {
      folder,
      orderId,
      success: false,
      filesUploaded: 0,
      skipped: [],
      error: "Order not found",
    };
  }

  const [{ extraFiles: existingExtraFiles }] = await db
    .select({ extraFiles: beltQueues.extraFiles })
    .from(beltQueues)
    .where(eq(beltQueues.orderId, orderId));

  const entries = await readdir(folderPath);
  const usable = entries.filter(
    (n) => !n.startsWith(".") && ALLOWED_EXT.has(extname(n).toLowerCase()),
  );
  const skipped = entries.filter(
    (n) => !n.startsWith(".") && !ALLOWED_EXT.has(extname(n).toLowerCase()),
  );

  if (usable.length === 0) {
    console.log(`  [skip] no uploadable files`);
    return {
      folder,
      orderId,
      success: true,
      filesUploaded: 0,
      skipped,
    };
  }

  console.log(`  found ${usable.length} file(s):`);
  usable.forEach((n) => console.log(`    - ${n}`));

  if (DRY_RUN) {
    console.log(`  [dry-run] would upload ${usable.length}`);
    return {
      folder,
      orderId,
      success: true,
      filesUploaded: usable.length,
      skipped,
    };
  }

  const filesToUpload: File[] = await Promise.all(
    usable.map(async (filename) => {
      const buf = await readFile(join(folderPath, filename));
      return new File([buf], filename, { type: guessMime(filename) });
    }),
  );

  console.log(`  uploading...`);
  const uploadResponse = await utapi.uploadFiles(filesToUpload);

  const uploadedFilesData = uploadResponse
    .map((r: any) => r?.data)
    .filter((d: any) => d != null);

  const failedNames = uploadResponse
    .map((r: any, i: number) => (r?.error ? usable[i] : null))
    .filter((n): n is string => n !== null);

  if (failedNames.length > 0) {
    console.log(`  [warn] ${failedNames.length} upload(s) failed:`);
    failedNames.forEach((n) => console.log(`    x ${n}`));
  }

  if (uploadedFilesData.length === 0) {
    return {
      folder,
      orderId,
      success: false,
      filesUploaded: 0,
      skipped,
      error: "All uploads failed",
    };
  }

  const merged = [
    ...(existingExtraFiles?.filter((f: any) => f != null) ?? []),
    ...uploadedFilesData,
  ];

  await db
    .update(beltQueues)
    .set({
      extraFiles: merged,
      extraFilesCreatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(beltQueues.orderId, orderId))
    .execute();

  console.log(
    `  uploaded ${uploadedFilesData.length} file(s); extraFiles now has ${merged.length}`,
  );

  return {
    folder,
    orderId,
    success: failedNames.length === 0,
    filesUploaded: uploadedFilesData.length,
    skipped,
    error: failedNames.length > 0 ? `Partial: ${failedNames.join(", ")}` : undefined,
  };
}

async function main() {
  console.log("Bulk upload from ooo/ to belt_queues.extraFiles");
  console.log(`Source: ${UPLOAD_DIR}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  const entries = await readdir(UPLOAD_DIR, { withFileTypes: true });
  const folders = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();

  if (folders.length === 0) {
    console.log("No folders found.");
    process.exit(0);
  }

  console.log(`Folders: ${folders.length}`);

  const results: UploadResult[] = [];
  for (const folder of folders) {
    results.push(await uploadFilesForFolder(folder, join(UPLOAD_DIR, folder)));
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  const ok = results.filter((r) => r.success && r.filesUploaded > 0);
  const fail = results.filter((r) => !r.success);
  const total = results.reduce((s, r) => s + r.filesUploaded, 0);
  console.log(`Success: ${ok.length}/${results.length}`);
  console.log(`Failed:  ${fail.length}/${results.length}`);
  console.log(`Files uploaded: ${total}`);
  if (fail.length) {
    console.log("\nFailures:");
    fail.forEach((r) =>
      console.log(`  ${r.folder} (${r.orderId || "?"}): ${r.error}`),
    );
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
