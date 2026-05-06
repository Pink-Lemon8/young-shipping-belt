"use server";

import { auth } from "@/lib/auth";
import { Result } from "@/lib/types";
import { headers } from "next/headers";
import { db } from "@/db/db";
import { beltQueuePharmacistReview, beltQueues, logs } from "@/db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { setLymlightOrderInfo } from "@/server/lymlight";

export const manualPushCompletedFromProcessView = async (orderId: string) => {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user) {
      return {
        status: "error",
        messages: ["User not found"],
      } as Result;
    }

    if (
      !["superAdmin", "admin", "coordinator"].includes(
        authentication.user.role ?? "regular",
      )
    ) {
      return {
        status: "error",
        messages: ["You are not authorized to complete this order"],
      } as Result;
    }

    const orderCheck = await db.query.beltQueues.findFirst({
      where: eq(beltQueues.orderId, orderId),
    });

    if (!orderCheck) {
      return {
        status: "error",
        messages: ["Order not found"],
      } as Result;
    }

    if (!["STAGE2", "STAGE3"].includes(orderCheck.status ?? "")) {
      return {
        status: "error",
        messages: ["Only stage 2 or stage 3 orders can be completed here"],
      } as Result;
    }

    const groupedOrders =
      orderCheck.groupId == null || orderCheck.groupId === -1
        ? []
        : await db
          .select({
            orderId: beltQueues.orderId,
          })
          .from(beltQueues)
          .where(eq(beltQueues.groupId, orderCheck.groupId));

    const targetOrderIds = Array.from(
      new Set([orderId, ...groupedOrders.map((item) => item.orderId)]),
    );

    const [getPharmacistReview] = await db
      .selectDistinct({
        count: count(),
      })
      .from(beltQueuePharmacistReview)
      .where(
        and(
          eq(beltQueuePharmacistReview.orderId, orderId),
          eq(beltQueuePharmacistReview.status, "APPROVED"),
        ),
      );

    const winnipegNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Winnipeg" }),
    );

    const [completedQueue] = await db
      .update(beltQueues)
      .set({
        status: "COMPLETED",
        lockedAt: null,
        lockedForUserId: null,
        shippedAt: winnipegNow,
      })
      .where(inArray(beltQueues.orderId, targetOrderIds));

    if (completedQueue.affectedRows === 0) {
      return {
        status: "error",
        messages: ["Failed to complete order"],
      } as Result;
    }

    if (orderCheck.affiliateId === -1) {
      const lymlightStatus =
        getPharmacistReview.count >= 2 ? "In_Transit" : "Final_Check";
      const lymlightShippingMethod =
        getPharmacistReview.count >= 2 ? orderCheck.shippingMethod : null;
      const lymlightTrackingNumber =
        getPharmacistReview.count >= 2 ? orderCheck.trackingNumber : null;
      const lymlightShippingDate =
        getPharmacistReview.count >= 2 ? winnipegNow : null;

      for (const targetOrderId of targetOrderIds) {
        await setLymlightOrderInfo({
          orderId: targetOrderId,
          newStatus: lymlightStatus,
          shippingMethod: lymlightShippingMethod,
          trackingNumber: lymlightTrackingNumber,
          shippingDate: lymlightShippingDate,
        });
      }
    }

    try {
      await db.insert(logs).values(
        targetOrderIds.map((targetOrderId) => ({
          action: "MANUAL_PUSH_QUEUE_COMPLETED",
          description: `Order ${targetOrderId} manually completed from process view by ${authentication.user?.name ?? ""}`,
          orderId: targetOrderId,
          beltCode: orderCheck.beltCode,
          userId: authentication.user?.id,
        })),
      );
    } catch (error) {
      console.log(error);
    }

    revalidatePath("/process-view");
    revalidatePath("/dashboard");

    return {
      status: "success",
      messages: [
        `Order ${orderId}${targetOrderIds.length > 1 ? ` and ${targetOrderIds.filter((id) => id !== orderId).join(", ")}` : ""} marked as completed`,
      ],
    } as Result;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      messages: ["Failed to complete order"],
    } as Result;
  }
};
