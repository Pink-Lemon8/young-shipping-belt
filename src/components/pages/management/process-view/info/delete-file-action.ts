"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { Result } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { beltQueues } from "@/db/schema";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function deleteQueueFile(orderId: string, fileKey: string) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (!authentication || !authentication.user)
      return {
        status: "error",
        messages: ["You must be logged in to delete files."],
      } as Result;

    const queue = await db
      .select({
        label: beltQueues.label,
        files: beltQueues.files,
        extraFiles: beltQueues.extraFiles,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (queue.length === 0)
      return {
        status: "error",
        messages: ["Order not found."],
      } as Result;

    const { label, files, extraFiles } = queue[0];

    const labelArray = Array.isArray(label) ? label : label ? [label] : [];
    const filesArray = files ?? [];
    const extraFilesArray = extraFiles ?? [];

    const labelIndex = labelArray.findIndex((f: any) => f?.key === fileKey);
    const filesIndex = filesArray.findIndex((f: any) => f?.key === fileKey);
    const extraFilesIndex = extraFilesArray.findIndex((f: any) => f?.key === fileKey);

    if (labelIndex === -1 && filesIndex === -1 && extraFilesIndex === -1) {
      return {
        status: "error",
        messages: ["File not found."],
      } as Result;
    }

    // Delete from UploadThing
    try {
      await utapi.deleteFiles([fileKey]);
    } catch (error) {
      console.log("Failed to delete from UploadThing:", error);
    }

    // Update the appropriate field
    const updateData: any = {};
    if (labelIndex !== -1) {
      const filteredLabel = labelArray.filter((f: any) => f?.key !== fileKey);
      updateData.label = filteredLabel.length > 0 ? filteredLabel : null;
    }
    if (filesIndex !== -1) {
      updateData.files = filesArray.filter((f: any) => f?.key !== fileKey);
    }
    if (extraFilesIndex !== -1) {
      updateData.extraFiles = extraFilesArray.filter((f: any) => f?.key !== fileKey);
    }

    await db
      .update(beltQueues)
      .set(updateData)
      .where(eq(beltQueues.orderId, orderId))
      .execute();

    revalidatePath("/process-view");

    return {
      status: "success",
      messages: ["File deleted successfully."],
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["An error occurred while deleting the file."],
    } as Result;
  }
}
