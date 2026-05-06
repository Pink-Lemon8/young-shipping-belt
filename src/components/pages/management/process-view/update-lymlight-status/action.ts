"use server";

import { auth } from "@/lib/auth";
import { Result } from "@/lib/types";
import { headers } from "next/headers";
import { db } from "@/db/db";
import { beltQueuePharmacistReview, beltQueues, logs } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { setLymlightOrderInfo } from "@/server/lymlight";

export const updateLymlightStatusFromProcessView = async (orderId: string) => {
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
        messages: ["You are not authorized to update Lymlight status"],
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

    if (orderCheck.affiliateId !== -1) {
      return {
        status: "error",
        messages: ["This action is only available for Lymlight orders"],
      } as Result;
    }

    if (orderCheck.status !== "COMPLETED") {
      return {
        status: "error",
        messages: ["Only completed orders can update Lymlight status"],
      } as Result;
    }

    const targetOrders =
      orderCheck.groupId == null || orderCheck.groupId === -1
        ? [orderCheck]
        : await db
          .select()
          .from(beltQueues)
          .where(eq(beltQueues.groupId, orderCheck.groupId));

    for (const targetOrder of targetOrders) {
      const [approvedReview] = await db
        .selectDistinct({
          count: count(),
        })
        .from(beltQueuePharmacistReview)
        .where(
          and(
            eq(beltQueuePharmacistReview.orderId, targetOrder.orderId),
            eq(beltQueuePharmacistReview.status, "APPROVED"),
          ),
        );

      const shouldMoveToInTransit = approvedReview.count >= 2;

      const response = await setLymlightOrderInfo({
        orderId: targetOrder.orderId,
        newStatus: shouldMoveToInTransit ? "In_Transit" : "Final_Check",
        shippingMethod: shouldMoveToInTransit ? targetOrder.shippingMethod : null,
        trackingNumber: shouldMoveToInTransit ? targetOrder.trackingNumber : null,
        shippingDate: shouldMoveToInTransit ? targetOrder.shippedAt : null,
      });

      if (!response) {
        return {
          status: "error",
          messages: [`Failed to update Lymlight status for order ${targetOrder.orderId}`],
        } as Result;
      }
    }

    try {
      await db.insert(logs).values(
        targetOrders.map((targetOrder) => ({
          action: "UPDATE_LYMLIGHT_STATUS",
          description: `Lymlight status updated from process view for order ${targetOrder.orderId} by ${authentication.user?.name ?? ""}`,
          orderId: targetOrder.orderId,
          beltCode: targetOrder.beltCode,
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
        `Lymlight status updated for ${targetOrders.map((item) => item.orderId).join(", ")}`,
      ],
    } as Result;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      messages: ["Failed to update Lymlight status"],
    } as Result;
  }
};
