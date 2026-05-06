"use server";

import { db } from "@/db/db";
import { beltQueues, orderExpectedItems, orderItems } from "@/db/schema";
import { and, eq, inArray, or } from "drizzle-orm";
import {
  getOrderDetailsFromPw,
  getOrderDetailsFromLym,
} from "@/server/controller/orders";

export async function getExpectedOrderItemsByOrderId(orderId: string) {
  try {
    const [getOrder] = await db
      .select({
        orderId: beltQueues.orderId,
        groupId: beltQueues.groupId,
        affiliateId: beltQueues.affiliateId,
        patientId: beltQueues.patientId,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (!getOrder) {
      return { status: "error", data: [] };
    }

    const groupId = getOrder.groupId ?? -1;
    const groupRows =
      groupId !== -1
        ? await db
            .select({
              orderId: beltQueues.orderId,
              affiliateId: beltQueues.affiliateId,
              patientId: beltQueues.patientId,
            })
            .from(beltQueues)
            .where(eq(beltQueues.groupId, groupId))
        : [];

    const orderIdList = Array.from(
      new Set([orderId, ...groupRows.map((o) => o.orderId)]),
    );

    const dbItems = await db
      .select({
        orderId: orderExpectedItems.orderId,
        packageId: orderExpectedItems.packageId,
        legacyId: orderExpectedItems.legacyId,
        din: orderExpectedItems.din,
        description: orderExpectedItems.description,
        quantity: orderExpectedItems.quantity,
        unitPrice: orderExpectedItems.unitPrice,
      })
      .from(orderExpectedItems)
      .where(inArray(orderExpectedItems.orderId, orderIdList));

    if (dbItems.length > 0) {
      return { status: "success", data: dbItems };
    }

    // No rows yet (typical for PENDING / not-yet-pulled orders).
    // Fetch live from PharmacyWire or Lymlight, the same way pullQueue does.
    const sourceRows: Array<{
      orderId: string;
      affiliateId: number | null;
      patientId: string | null;
    }> = [
      {
        orderId: getOrder.orderId,
        affiliateId: getOrder.affiliateId,
        patientId: getOrder.patientId,
      },
      ...groupRows
        .filter((r) => r.orderId !== getOrder.orderId)
        .map((r) => ({
          orderId: r.orderId,
          affiliateId: r.affiliateId,
          patientId: r.patientId,
        })),
    ];

    const liveResults = await Promise.all(
      sourceRows.map(async (row) => {
        try {
          const res =
            row.affiliateId === -1
              ? await getOrderDetailsFromLym({
                  orderId: row.orderId,
                  patientId: row.patientId,
                })
              : await getOrderDetailsFromPw(
                  row.orderId,
                  row.patientId ?? "",
                );
          if (res?.status !== "success") return [];
          return (res.value?.items ?? []).map((it: any) => ({
            orderId: row.orderId,
            packageId: it.packageId,
            legacyId: it.legacyId ?? null,
            din: it.din ?? null,
            description: it.description ?? null,
            quantity: it.quantity,
            unitPrice: it.unitPrice ?? null,
          }));
        } catch (e) {
          console.error(
            "Live items fetch failed for",
            row.orderId,
            e,
          );
          return [];
        }
      }),
    );

    const liveItems = liveResults.flat();
    return { status: "success", data: liveItems };
  } catch (error) {
    console.error("Error fetching expected order items:", error);
    return { status: "error", data: [] };
  }
}

export async function getOrderItemsByOrderId(orderId: string) {
  try {
    const [getOrder] = await db
      .select({
        groupId: beltQueues.groupId,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (!getOrder) {
      return { status: "error", data: [] };
    }

    const getGroupOrderIds = await db
      .select({
        orderId: beltQueues.orderId,
      })
      .from(beltQueues)
      .where(eq(beltQueues.groupId, getOrder.groupId ?? -1));

    const items = await db
      .select({
        packageId: orderItems.packageId,
        lotNumber: orderItems.lotNumber,
        quantity: orderItems.quantity,
        legacyId: orderItems.legacyId,
        din: orderItems.din,
        description: orderExpectedItems.description,
      })
      .from(orderItems)
      .leftJoin(
        orderExpectedItems,
        and(
          eq(orderItems.packageId, orderExpectedItems.packageId),
          eq(orderItems.orderId, orderExpectedItems.orderId),
        ),
      )
      .where(
        or(
          eq(orderItems.orderId, orderId),
          getGroupOrderIds.length > 0
            ? inArray(
                orderItems.orderId,
                getGroupOrderIds.map((o) => o.orderId) ?? [],
              )
            : undefined,
        ),
      );

    return { status: "success", data: items };
  } catch (error) {
    console.error("Error fetching order items:", error);
    return { status: "error", data: [] };
  }
}
