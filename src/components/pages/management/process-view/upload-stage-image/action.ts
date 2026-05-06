"use server";
import { UTApi } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { Result } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { beltQueues, logs } from "@/db/schema";
import { headers } from "next/headers";
import sharp from "sharp";
import { base64ToFile } from "@/server/pharmacyWR/utils";

const utapi = new UTApi();

const validationSchema = z.object({
  orderId: z.string().min(1, { message: "Order ID is required" }),
  stage: z.enum(["1", "2", "3"], {
    errorMap: () => ({ message: "Stage must be 1, 2, or 3" }),
  }),
  file: z.instanceof(File, { message: "File is required" }),
});

export async function uploadStageImage(
  result: Result | undefined,
  formData: FormData,
): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (!authentication?.user) {
      return {
        status: "error",
        messages: ["You must be logged in to upload stage images"],
      } as Result;
    }

    const validation = validationSchema.safeParse({
      orderId: formData.get("orderId"),
      stage: formData.get("stage"),
      file: formData.get("file"),
    });

    if (!validation.success) {
      return {
        status: "error",
        messages: validation.error.errors.map((e) => e.message),
      } as Result;
    }

    const { orderId, stage, file: rawFile } = validation.data;

    const [existing] = await db
      .select({ orderId: beltQueues.orderId, images: beltQueues.images, status: beltQueues.status })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (!existing) {
      return {
        status: "error",
        messages: [`Order ${orderId} not found`],
      } as Result;
    }

    if (existing.status === "PENDING") {
      return {
        status: "error",
        messages: ["Cannot upload stage images for orders in PENDING status"],
      } as Result;
    }

    const buffer = await rawFile.arrayBuffer();
    const isImage = (rawFile.type || "").startsWith("image/");
    const processedBuffer = isImage
      ? await sharp(buffer).jpeg({ quality: 100 }).rotate(180).toBuffer()
      : Buffer.from(buffer);
    const mime = isImage ? "image/jpeg" : rawFile.type || "application/octet-stream";
    const ext = isImage ? "jpeg" : (rawFile.name.split(".").pop() ?? "bin");
    const fileName = `image_${orderId}_stage${stage}.${ext}`;

    const utFile = await base64ToFile(
      processedBuffer.toString("base64"),
      fileName,
      mime,
    );

    if (!utFile) {
      return {
        status: "error",
        messages: ["Failed to prepare file for upload"],
      } as Result;
    }

    const uploadResponse = await utapi.uploadFiles([utFile]);
    const uploaded = uploadResponse[0]?.data;

    if (!uploaded) {
      return {
        status: "error",
        messages: ["Failed to upload image"],
      } as Result;
    }

    const existingImages = (existing.images ?? []).filter((f: any) => f != null);

    await db
      .update(beltQueues)
      .set({
        images: [...existingImages, uploaded],
      })
      .where(eq(beltQueues.orderId, orderId));

    try {
      await db.insert(logs).values({
        action: `MANUAL_UPLOAD_STAGE${stage}_IMAGE`,
        orderId,
        userId: authentication.user.id,
        description: `Manually uploaded stage ${stage} image for ${orderId} by ${authentication.user.name ?? authentication.user.email ?? "unknown"}`,
      });
    } catch {}

    revalidatePath("/process-view");

    return {
      status: "success",
      messages: [`Stage ${stage} image uploaded for ${orderId}`],
    } as Result;
  } catch (error) {
    console.log("uploadStageImage error:", error);
    return {
      status: "error",
      messages: ["Failed to upload stage image"],
    } as Result;
  }
}
