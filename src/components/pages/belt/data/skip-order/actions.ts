"use server";

import { db } from "@/db/db";
import { beltQueues, logs } from "@/db/schema";
import { Result } from "@/lib/types";
import { and, eq, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function skip(orderId: string, skipReason: string | undefined) {
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
      .select()
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (!currentOrder)
      return {
        status: "error",
        messages: ["Order not found in queue"],
      } as Result;

    const [skiped] = await db
      .update(beltQueues)
      .set({
        lockedAt: null,
        lockedForUserId: null,
        skipped: true,
        skippedAt: sql`CURRENT_TIMESTAMP`,
        skippedBy: authentication.user?.id,
        comments: [...(currentOrder?.comments ?? []), skipReason ?? ""],
      })
      .where(
        or(
          eq(beltQueues.orderId, orderId),
          beltQueues.groupId !== null
            ? eq(beltQueues.groupId, currentOrder.groupId ?? -1)
            : undefined,
        ),
      );

    if (skiped.affectedRows === 0)
      return {
        status: "error",
        messages: ["Failed to skip order in queue"],
      } as Result;

    try {
      const createLog = await db
        .insert(logs)
        .values({
          action: "PUSH_QUEUE_SKIP",
          orderId: orderId,
          description: `Order ${orderId} skipped by ${authentication.user?.name ?? ""}`,
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
      messages: ["Order skipped in queue"],
    } as Result;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      messages: ["Failed to skip order in queue"],
    } as Result;
  }
}

export async function OpenSkipping(orderId: string) {
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
      .select()
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (!currentOrder)
      return {
        status: "error",
        messages: ["Order not found in queue"],
      } as Result;

    const [skiped] = await db
      .update(beltQueues)
      .set({
        lockedAt: null,
        lockedForUserId: null,
        skipped: false,
        skippedAt: null,
        skippedBy: null,
        comments: null,
      })
      .where(
        or(
          eq(beltQueues.orderId, orderId),
          beltQueues.groupId !== null
            ? eq(beltQueues.groupId, currentOrder.groupId ?? -1)
            : undefined,
        ),
      );

    if (skiped.affectedRows === 0)
      return {
        status: "error",
        messages: ["Failed to open skipping for order in queue"],
      } as Result;

    try {
      const createLog = await db
        .insert(logs)
        .values({
          action: "PUSH_QUEUE_SKIP_OPEN",
          orderId: orderId,
          description: `Order ${orderId} opened skipping by ${authentication.user?.name ?? ""}`,
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
      messages: ["Order opened in queue"],
    } as Result;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      messages: ["Failed to open skipping for order in queue"],
    } as Result;
  }
}
