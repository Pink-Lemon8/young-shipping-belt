"use server";

import { db } from "@/db/db";
import {
  beltQueuePharmacistReview,
  beltQueues,
  beltQueuesHistory,
  logs,
} from "@/db/schema";
import { Result } from "@/lib/types";
import { eq, inArray, not, and, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { setLymlightOrderInfo } from "@/server/lymlight";
import { headers } from "next/headers";

export const deleteFromBelt = async (orderId: string) => {
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
        messages: ["You are not authorized to delete from belt"],
      } as Result;

    const orderCheck = await db
      .select()
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId))
      .limit(1);

    if (orderCheck.length === 0)
      return {
        status: "error",
        messages: [`Order ${orderId} not found`],
      } as Result;

    const groupOrderCheck = await db
      .select()
      .from(beltQueues)
      .where(
        and(
          not(eq(beltQueues.orderId, orderId)),
          eq(beltQueues.groupId, orderCheck[0]?.groupId ?? -1),
        ),
      );

    const deleteFromBelt = await db.transaction(async (tx) => {
      const pharmacyReview = await db
        .select()
        .from(beltQueuePharmacistReview)
        .where(
          or(
            eq(beltQueuePharmacistReview.orderId, orderId),
            inArray(
              beltQueuePharmacistReview.orderId,
              groupOrderCheck.map((o) => o.orderId) ?? ["-1"],
            ),
          ),
        );

      if (pharmacyReview.length > 0) {
        const [pharmacistReview] = await tx
          .delete(beltQueuePharmacistReview)
          .where(
            or(
              eq(beltQueuePharmacistReview.orderId, orderId),
              inArray(
                beltQueuePharmacistReview.orderId,
                groupOrderCheck.map((o) => o.orderId) ?? ["-1"],
              ),
            ),
          );

        if (pharmacistReview.affectedRows !== pharmacyReview.length)
          tx.rollback();
      }

      const [storeInHistory] = await tx
        .insert(beltQueuesHistory)
        .values([orderCheck[0], ...groupOrderCheck.map((o) => o)]);

      if (storeInHistory.affectedRows === 0) tx.rollback();

      const [queueUpdated] = await tx
        .delete(beltQueues)
        .where(
          or(
            eq(beltQueues.orderId, orderId),
            inArray(
              beltQueues.orderId,
              groupOrderCheck.map((o) => o.orderId) ?? ["-1"],
            ),
          ),
        );

      if (queueUpdated.affectedRows === 0) tx.rollback();

      return {
        status: "success",
        messages: [
          `Order ${orderId}${groupOrderCheck.length > 0 ? ` and ${groupOrderCheck.map((o) => o.orderId).join(", ")}` : ""} deleted from belt ${orderCheck[0]?.beltCode}`,
        ],
      } as Result;
    });

    if (deleteFromBelt?.status === "error")
      return {
        status: "error",
        messages: [
          `Failed to delete order ${orderId}${groupOrderCheck.length > 0 ? ` and ${groupOrderCheck.map((o) => o.orderId).join(", ")}` : ""} from belt ${orderCheck[0]?.beltCode}`,
        ],
      } as Result;

    if (orderCheck[0]?.affiliateId === -1)
      await setLymlightOrderInfo({
        orderId: orderId,
        newStatus: "Picking",
        trackingNumber: null,
        shippingDate: null,
      });

    if (orderCheck[0]?.affiliateId === -1 && groupOrderCheck.length > 0) {
      for (const groupOrder of groupOrderCheck) {
        await setLymlightOrderInfo({
          orderId: groupOrder.orderId,
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
            action: "DELETE_QUEUE",
            description: `Order ${orderId} deleted from belt ${orderCheck[0]?.beltCode} by ${authentication.user?.name ?? ""}`,
            orderId: orderId,
            beltCode: orderCheck[0]?.beltCode,
            userId: authentication.user?.id,
          },
          ...(groupOrderCheck.length > 0
            ? groupOrderCheck.map((o) => ({
                action: "DELETE_QUEUE",
                description: `Order ${o.orderId} deleted from belt ${orderCheck[0]?.beltCode} by ${authentication.user?.name ?? ""}`,
                orderId: o.orderId,
                beltCode: orderCheck[0]?.beltCode,
                userId: authentication.user?.id,
              }))
            : []),
        ])
        .execute();
    } catch (error) {
      console.log(error);
    }

    revalidatePath("/process-view");
    return deleteFromBelt;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      messages: ["Failed to delete from belt"],
    } as Result;
  }
};
