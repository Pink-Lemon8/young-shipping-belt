"use server";

import { db } from "@/db/db";
import { beltQueues, logs } from "@/db/schema";
import { Result } from "@/lib/types";
import { eq, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function unlock(orderId: string) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication.user) {
      return {
        status: "error",
        messages: ["You are not authorized to skip order"],
      } as Result;
    }

    const [currentOrder] = await db
      .select({
        orderId: beltQueues.orderId,
        groupId: beltQueues.groupId,
        beltCode: beltQueues.beltCode,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (!currentOrder)
      return {
        status: "error",
        messages: ["Order not found in queue"],
      } as Result;

    const [unlocked] = await db
      .update(beltQueues)
      .set({
        lockedAt: null,
        lockedForUserId: null,
      })
      .where(
        or(
          eq(beltQueues.orderId, orderId),
          currentOrder.groupId
            ? eq(beltQueues.groupId, currentOrder.groupId)
            : undefined,
        ),
      );

    if (unlocked.affectedRows === 0)
      return {
        status: "error",
        messages: ["Failed to unlock order in queue"],
      } as Result;

    try {
      const createLog = await db
        .insert(logs)
        .values({
          action: "PUSH_QUEUE_UNLOCK",
          orderId: orderId,
          description: `Order ${orderId} unlocked by ${authentication.user?.name ?? ""}`,
          userId: authentication.user?.id,
          beltCode: currentOrder.beltCode ?? "",
        })
        .execute();
    } catch (error) {
      console.log(error);
    }

    revalidatePath(`/belt`);
    revalidatePath(`/process-view`);
    return {
      status: "success",
      messages: ["Order unlocked in queue"],
    } as Result;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      messages: ["Failed to unlock order in queue"],
    } as Result;
  }
}
