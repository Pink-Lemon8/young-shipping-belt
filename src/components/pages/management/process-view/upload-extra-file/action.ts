"use server";
import { PDFDocument } from "pdf-lib";
import { UTApi } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import { eq, sql } from "drizzle-orm";
import { Result } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { beltQueues } from "@/db/schema";
import { headers } from "next/headers";
const utapi = new UTApi();

const validationSchema = z.object({
  orderId: z.string().min(1, { message: "Order ID is required" }),
  file: z.instanceof(File, { message: "File is required" }),
  specialName: z
    .string({ message: "Special name is optional" })
    .nullable()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
});

//TODO: check later
export async function uploadExtraFiles(
  result: Result | undefined,
  formData: FormData
) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (!authentication || !authentication.user)
      return {
        status: "error",
        messages: ["You must be logged in to upload extra files"],
      } as Result;

    const validation = validationSchema.safeParse({
      orderId: formData.get("orderId"),
      file: formData.get("file"),
      specialName: formData.get("specialName"),
    });

    if (!validation.success)
      return {
        status: "error",
        messages: validation.error.errors.map((error) => error.message),
      } as Result;

    const getExtraFiles = await db
      .select({
        extraFiles: beltQueues.extraFiles,
        extraFilesCreatedAt: beltQueues.extraFilesCreatedAt,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, validation.data.orderId));

    if (getExtraFiles.length === 0)
      return {
        status: "error",
        messages: ["No order found"],
      } as Result;

    const fileType = validation.data.file.type;
    const fileName = validation.data.file.name;
    const newFileName = validation.data.specialName
      ? validation.data.specialName
      : fileName;

    const renamedFile = new File([validation.data.file], newFileName, {
      type: fileType,
    });
    const uploadResponse = await utapi.uploadFiles([renamedFile]);

    const extraFilesData = uploadResponse.map((file: any) => file.data);

    const existingExtraFiles = getExtraFiles[0].extraFiles ?? [];

    const uploadDb = await db
      .update(beltQueues)
      .set({
        extraFiles: [
          ...(existingExtraFiles.filter((file: any) => file !== null) ?? []),
          ...extraFilesData,
        ],
        extraFilesCreatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(beltQueues.orderId, validation.data.orderId))
      .execute();

    revalidatePath("/process-view");

    return {
      status: "success",
      messages: ["Extra file is uploaded."],
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["An error occurred while uploading extra files."],
    } as Result;
  }
}

export async function removeExtraFiles(orderId: string, fileKey: string) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (!authentication || !authentication.user)
      return {
        status: "error",
        messages: ["You must be logged in to remove extra files."],
      } as Result;

    const getExtraFiles = await db
      .select({
        extraFiles: beltQueues.extraFiles,
        extraFilesCreatedAt: beltQueues.extraFilesCreatedAt,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (
      getExtraFiles[0]?.extraFiles === undefined ||
      getExtraFiles[0]?.extraFiles === null
    )
      return {
        status: "error",
        messages: ["No extra files found."],
      } as Result;

    const filteredExtraFiles = getExtraFiles[0].extraFiles?.filter(
      (file: any) => file.key !== fileKey
    );

    const result = await db
      .update(beltQueues)
      .set({
        extraFiles: filteredExtraFiles ?? null,
        extraFilesCreatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(beltQueues.orderId, orderId))
      .execute();

    revalidatePath("/process-view");

    return {
      status: "success",
      messages: ["Extra files removed"],
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["An error occurred while removing extra files."],
    } as Result;
  }
}
