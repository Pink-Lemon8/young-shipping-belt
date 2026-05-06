"use server";

import { db } from "@/db/db";
import { beltQueuePharmacistReview, beltQueues, logs } from "@/db/schema";
import { Result } from "@/lib/types";
import { eq, inArray, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { setLymlightOrderInfo } from "@/server/lymlight";
import { headers } from "next/headers";

export const pushBackToStage1 = async (orderId: string) => {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication.user)
      return {
        status: "error",
        messages: ["User not found"],
      } as Result;

    if (
      !["superAdmin", "admin", "coordinator"].includes(
        authentication.user.role ?? "regular",
      )
    )
      return {
        status: "error",
        messages: ["You are not authorized to push back to stage 1"],
      } as Result;

    const orderCheck = await db
      .select()
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId))
      .limit(1);

    if (orderCheck.length === 0)
      return {
        status: "error",
        messages: ["Order not found"],
      } as Result;

    const groupOrderIds = await db
      .select({
        orderId: beltQueues.orderId,
      })
      .from(beltQueues)
      .where(eq(beltQueues.groupId, orderCheck[0]?.groupId ?? -1));

    const moveStage1 = await db.transaction(async (tx) => {
      const [queueUpdated] = await tx
        .update(beltQueues)
        .set({
          status: "STAGE1",
          images: null,
          cageCode: null,
          comments: null,
          lockedAt: null,
          lockedForUserId: null,
        })
        .where(
          or(
            eq(beltQueues.orderId, orderId),
            eq(beltQueues.groupId, orderCheck[0]?.groupId ?? -1),
          ),
        );

      if (queueUpdated.affectedRows === 0) tx.rollback();

      const [pharmacistReview] = await tx
        .delete(beltQueuePharmacistReview)
        .where(
          or(
            eq(beltQueuePharmacistReview.orderId, orderId),
            inArray(
              beltQueuePharmacistReview.orderId,
              groupOrderIds.map((o) => o.orderId) ?? ["-1"],
            ),
          ),
        );

      return {
        status: "success",
        messages: ["Pushed back to stage 1"],
      } as Result;
    });

    if (moveStage1?.status === "error")
      return {
        status: "error",
        messages: ["Failed to push back to stage 1"],
      } as Result;

    if (orderCheck[0]?.affiliateId === -1)
      await setLymlightOrderInfo({
        orderId: orderId,
        newStatus: "Picking",
        trackingNumber: null,
        shippingDate: null,
      });
    if (orderCheck[0]?.affiliateId === -1 && groupOrderIds.length > 0) {
      for (const groupOrderId of groupOrderIds) {
        await setLymlightOrderInfo({
          orderId: groupOrderId.orderId,
          newStatus: "Picking",
          trackingNumber: null,
          shippingDate: null,
        });
      }
    }
    try {
      const createLog = await db
        .insert(logs)
        .values([
          {
            action: "PUSH_QUEUE_BACK_STAGE1",
            description: `Order ${orderId} pushed back to STAGE1 by ${authentication.user?.name ?? ""}`,
            orderId: orderId,
            beltCode: orderCheck[0]?.beltCode,
            userId: authentication.user?.id,
          },
          ...(groupOrderIds ?? []).map((groupOrderId: { orderId: string }) => ({
            action: "PUSH_QUEUE_BACK_STAGE1",
            description: `Order ${groupOrderId.orderId} pushed back to STAGE1 by ${authentication.user?.name ?? ""}`,
            orderId: groupOrderId.orderId,
            beltCode: orderCheck[0]?.beltCode,
            userId: authentication.user?.id,
          })),
        ])
        .execute();
    } catch (error) {
      console.log(error);
    }
    revalidatePath("/process-view");
    return moveStage1;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      messages: ["Failed to push back to stage 1"],
    } as Result;
  }
};
