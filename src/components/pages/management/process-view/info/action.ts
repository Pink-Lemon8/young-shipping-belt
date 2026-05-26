"use server";

import { db } from "@/db/db";
import { beltQueues, orderExpectedItems, orderItems } from "@/db/schema";
import { and, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  getOrderDetailsFromPw,
  getOrderDetailsFromLym,
} from "@/server/controller/orders";

function getOrderedItemKey(item: {
  packageId?: string | number | null;
  legacyId?: string | number | null;
  din?: string | number | null;
  description?: string | null;
}) {
  return JSON.stringify({
    packageId: item.packageId ?? null,
    legacyId: item.legacyId ?? null,
    din: item.din ?? null,
    description: item.description ?? null,
  });
}

function getOrderedItems(metadata: any): Record<string, boolean> {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata) ||
    !metadata.orderedItems ||
    typeof metadata.orderedItems !== "object" ||
    Array.isArray(metadata.orderedItems)
  ) {
    return {};
  }

  return metadata.orderedItems;
}

function getSpecialItems(metadata: any): Record<string, boolean> {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata) ||
    !metadata.specialItems ||
    typeof metadata.specialItems !== "object" ||
    Array.isArray(metadata.specialItems)
  ) {
    return {};
  }

  return metadata.specialItems;
}

function getReceivedItems(metadata: any): Record<string, boolean> {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata) ||
    !metadata.receivedItems ||
    typeof metadata.receivedItems !== "object" ||
    Array.isArray(metadata.receivedItems)
  ) {
    return {};
  }

  return metadata.receivedItems;
}

function getMetadataObject(metadata: unknown) {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata
    : {};
}

function withOrderItemFlags<
  T extends {
    orderId: string;
    packageId?: string | number | null;
    legacyId?: string | number | null;
    din?: string | number | null;
    description?: string | null;
  },
>(
  item: T,
  metadataByOrderId: Map<string, any>,
) {
  const orderedKey = getOrderedItemKey(item);
  const metadata = metadataByOrderId.get(item.orderId);
  const orderedItems = getOrderedItems(metadata);
  const specialItems = getSpecialItems(metadata);
  const receivedItems = getReceivedItems(metadata);
  const rawOrdered = Boolean(orderedItems[orderedKey]);
  const rawSpecial = Boolean(specialItems[orderedKey]);

  return {
    ...item,
    orderedKey,
    ordered: rawOrdered,
    special: rawSpecial && !rawOrdered,
    received: Boolean(receivedItems[orderedKey]),
  };
}

function truncate(value: string | null, maxLength: number) {
  return value && value.length > maxLength ? value.slice(0, maxLength) : value;
}

function normalizeExpectedItemForDb(item: any) {
  if (!item?.orderId || !item?.packageId) return undefined;

  return {
    orderId: String(item.orderId),
    packageId: truncate(String(item.packageId), 255) ?? "",
    legacyId: item.legacyId ? truncate(String(item.legacyId), 255) : null,
    din: item.din ? truncate(String(item.din), 255) : null,
    description: item.description
      ? truncate(String(item.description), 255)
      : null,
    quantity: Number(item.quantity ?? 0),
    unitPrice:
      item.unitPrice !== undefined && item.unitPrice !== null
        ? String(item.unitPrice)
        : null,
  };
}

export async function getExpectedOrderItemsByOrderId(orderId: string) {
  try {
    const [getOrder] = await db
      .select({
        orderId: beltQueues.orderId,
        groupId: beltQueues.groupId,
        affiliateId: beltQueues.affiliateId,
        patientId: beltQueues.patientId,
        metadata: beltQueues.metadata,
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
            metadata: beltQueues.metadata,
          })
          .from(beltQueues)
          .where(eq(beltQueues.groupId, groupId))
        : [];

    const orderIdList = Array.from(
      new Set([orderId, ...groupRows.map((o) => o.orderId)]),
    );
    const metadataByOrderId = new Map<string, any>(
      [
        { orderId: getOrder.orderId, metadata: getOrder.metadata },
        ...groupRows,
      ].map((row) => [row.orderId, row.metadata]),
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
      return {
        status: "success",
        data: dbItems.map((item) => withOrderItemFlags(item, metadataByOrderId)),
      };
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
    const expectedItemsToSave = liveItems
      .map(normalizeExpectedItemForDb)
      .filter((item): item is NonNullable<typeof item> => item !== undefined);

    if (expectedItemsToSave.length > 0) {
      await db.transaction(async (tx) => {
        await tx
          .delete(orderExpectedItems)
          .where(inArray(orderExpectedItems.orderId, orderIdList));

        await tx.insert(orderExpectedItems).values(expectedItemsToSave);
      });
      revalidatePath("/process-view");
    }

    return {
      status: "success",
      data: expectedItemsToSave.map((item) =>
        withOrderItemFlags(item, metadataByOrderId),
      ),
    };
  } catch (error) {
    console.error("Error fetching expected order items:", error);
    return { status: "error", data: [] };
  }
}

export async function updateExpectedOrderItemOrdered({
  orderId,
  orderedKey,
  ordered,
}: {
  orderId: string;
  orderedKey: string;
  ordered: boolean;
}) {
  try {
    if (!orderId || !orderedKey) {
      return { status: "error", message: "Order ID and item key are required" };
    }

    const [queue] = await db
      .select({
        metadata: beltQueues.metadata,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (!queue) {
      return { status: "error", message: "Order not found" };
    }

    const metadata = getMetadataObject(queue.metadata);
    const currentReceivedItems = getReceivedItems(metadata);
    const currentSpecialItems = getSpecialItems(metadata);
    const orderedItems = {
      ...getOrderedItems(metadata),
      [orderedKey]: ordered,
    };
    const specialItems = {
      ...currentSpecialItems,
      [orderedKey]: ordered ? false : Boolean(currentSpecialItems[orderedKey]),
    };
    const receivedItems = {
      ...currentReceivedItems,
      [orderedKey]: false,
    };

    await db
      .update(beltQueues)
      .set({
        metadata: {
          ...metadata,
          orderedItems,
          specialItems,
          receivedItems,
        },
      })
      .where(eq(beltQueues.orderId, orderId));

    revalidatePath("/process-view");

    return { status: "success" };
  } catch (error) {
    console.error("Error updating ordered item flag:", error);
    return { status: "error", message: "Failed to update item" };
  }
}

export async function updateExpectedOrderItemSpecial({
  orderId,
  orderedKey,
  special,
}: {
  orderId: string;
  orderedKey: string;
  special: boolean;
}) {
  try {
    if (!orderId || !orderedKey) {
      return { status: "error", message: "Order ID and item key are required" };
    }

    const [queue] = await db
      .select({
        metadata: beltQueues.metadata,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (!queue) {
      return { status: "error", message: "Order not found" };
    }

    const metadata = getMetadataObject(queue.metadata);
    const currentOrderedItems = getOrderedItems(metadata);
    const orderedItems = {
      ...currentOrderedItems,
      [orderedKey]: special ? false : Boolean(currentOrderedItems[orderedKey]),
    };
    const specialItems = {
      ...getSpecialItems(metadata),
      [orderedKey]: special,
    };
    const receivedItems = {
      ...getReceivedItems(metadata),
      [orderedKey]: false,
    };

    await db
      .update(beltQueues)
      .set({
        metadata: {
          ...metadata,
          orderedItems,
          specialItems,
          receivedItems,
        },
      })
      .where(eq(beltQueues.orderId, orderId));

    revalidatePath("/process-view");

    return { status: "success" };
  } catch (error) {
    console.error("Error updating special item flag:", error);
    return { status: "error", message: "Failed to update item" };
  }
}

export async function updateExpectedOrderItemReceived({
  orderId,
  orderedKey,
  received,
}: {
  orderId: string;
  orderedKey: string;
  received: boolean;
}) {
  try {
    if (!orderId || !orderedKey) {
      return { status: "error", message: "Order ID and item key are required" };
    }

    const [queue] = await db
      .select({
        metadata: beltQueues.metadata,
      })
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId));

    if (!queue) {
      return { status: "error", message: "Order not found" };
    }

    const metadata = getMetadataObject(queue.metadata);
    const orderedItems = getOrderedItems(metadata);
    const specialItems = getSpecialItems(metadata);

    if (!orderedItems[orderedKey] && !specialItems[orderedKey]) {
      return {
        status: "error",
        message: "Item must be marked ordered or special before it can be received",
      };
    }

    const receivedItems = {
      ...getReceivedItems(metadata),
      [orderedKey]: received,
    };

    await db
      .update(beltQueues)
      .set({
        metadata: {
          ...metadata,
          receivedItems,
        },
      })
      .where(eq(beltQueues.orderId, orderId));

    revalidatePath("/process-view");

    return { status: "success" };
  } catch (error) {
    console.error("Error updating received item flag:", error);
    return { status: "error", message: "Failed to update item" };
  }
}

export async function updateExpectedOrderItemFlags(
  updates: Array<{
    orderId: string;
    orderedKey: string;
    ordered?: boolean;
    special?: boolean;
    received?: boolean;
  }>,
) {
  try {
    const validUpdates = updates.filter(
      (update) => update.orderId && update.orderedKey,
    );

    if (validUpdates.length === 0) {
      return { status: "error", message: "No items to update" };
    }

    const orderIds = Array.from(
      new Set(validUpdates.map((update) => update.orderId)),
    );
    const queues = await db
      .select({
        orderId: beltQueues.orderId,
        metadata: beltQueues.metadata,
      })
      .from(beltQueues)
      .where(inArray(beltQueues.orderId, orderIds));

    if (queues.length !== orderIds.length) {
      return { status: "error", message: "One or more orders were not found" };
    }

    const updatesByOrderId = new Map<string, typeof validUpdates>();
    for (const update of validUpdates) {
      const currentUpdates = updatesByOrderId.get(update.orderId) ?? [];
      currentUpdates.push(update);
      updatesByOrderId.set(update.orderId, currentUpdates);
    }

    await db.transaction(async (tx) => {
      for (const queue of queues) {
        const metadata = getMetadataObject(queue.metadata);
        const orderedItems = { ...getOrderedItems(metadata) };
        const specialItems = { ...getSpecialItems(metadata) };
        const receivedItems = { ...getReceivedItems(metadata) };

        for (const update of updatesByOrderId.get(queue.orderId) ?? []) {
          if (typeof update.ordered === "boolean") {
            orderedItems[update.orderedKey] = update.ordered;
            if (update.ordered) {
              specialItems[update.orderedKey] = false;
            }
            receivedItems[update.orderedKey] = false;
          }

          if (typeof update.special === "boolean") {
            specialItems[update.orderedKey] = update.special;
            if (update.special) {
              orderedItems[update.orderedKey] = false;
            }
            receivedItems[update.orderedKey] = false;
          }

          if (typeof update.received === "boolean") {
            if (
              update.received &&
              !orderedItems[update.orderedKey] &&
              !specialItems[update.orderedKey]
            ) {
              throw new Error(
                "Item must be marked ordered or special before it can be received",
              );
            }

            receivedItems[update.orderedKey] = update.received;
          }
        }

        await tx
          .update(beltQueues)
          .set({
            metadata: {
              ...metadata,
              orderedItems,
              specialItems,
              receivedItems,
            },
          })
          .where(eq(beltQueues.orderId, queue.orderId));
      }
    });

    revalidatePath("/process-view");

    return { status: "success" };
  } catch (error) {
    console.error("Error updating item flags:", error);
    return { status: "error", message: "Failed to update items" };
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
