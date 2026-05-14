"use server";
import {
  getQueueByBeltCodeAndLockForBeltUser,
  setAllUnlockedBeltUserInQueue,
} from "@/server/controller/queues";
import {
  getOrderDetailsFromLym,
  getOrderDetailsFromPw,
} from "@/server/controller/orders";
import { auth } from "@/lib/auth";
import { getUserById } from "@/server/controller/users";
import { Result } from "@/lib/types";
import { base64ToFile } from "@/server/pharmacyWR/utils";
import { UTApi } from "uploadthing/server";
import { db } from "@/db/db";
import { and, count, eq, gte, inArray, lte, not, or, sql } from "drizzle-orm";
import {
  beltQueuePharmacistReview,
  beltQueues,
  logs,
  orderExpectedItems,
  orderItems,
  packageBarcodes,
  packageExtras,
  users,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import {
  setLymlightOrderInfo,
  updateLymlightInventory,
} from "@/server/lymlight";
import { headers } from "next/headers";

const utapi = new UTApi();

export async function pullQueue(
  beltCode: string,
  stage: "1" | "2" | "3",
  userBeltCode?: string | undefined,
  orderIds?: string[] | undefined,
  trackingNumbers?: string[] | undefined,
  authUser?: { id: string; name?: string; role?: string } | undefined,
): Promise<Result> {
  try {
    // Use passed auth user or fetch if not provided (for backward compatibility)
    let userId: string;
    let userName: string | undefined;
    let userRole: string;

    if (authUser?.id && authUser?.role) {
      userId = authUser.id;
      userName = authUser.name;
      userRole = authUser.role;
    } else {
      // Fallback: fetch auth (for cases where pullQueue is called directly)
      const authentication = await auth.api.getSession({
        headers: await headers(),
      });

      if (!authentication || !authentication?.user) {
        return {
          status: "error",
          messages: ["You are not authorized to pull queue"],
        } as Result;
      }

      const beltUser = await getUserById(authentication?.user?.id ?? "-1");
      await setAllUnlockedBeltUserInQueue(authentication?.user?.id ?? "-1");

      userId = beltUser?.id ?? "-1";
      userName = authentication?.user?.name ?? undefined;
      userRole = beltUser?.role ?? "regular";
    }

    if (!["superAdmin", "admin", "coordinator", "belt"].includes(userRole))
      return {
        status: "error",
        messages: [
          "You are not authorized to pull queue. Only belt users can pull queue.",
        ],
      } as Result;

    const beltStage: "STAGE1" | "STAGE2" | "STAGE3" = ("STAGE" + stage) as
      | "STAGE1"
      | "STAGE2"
      | "STAGE3";
    const finalStatusArray: (
      | "SENT_TO_BELT"
      | "STAGE1"
      | "STAGE2"
      | "STAGE3"
    )[] = [
        ...(stage === "1" ? ["SENT_TO_BELT" as "SENT_TO_BELT"] : []),
        beltStage,
      ];

    // Single call with includeTotalCount=true to get both queue and total count
    const queueAndLength: any = await getQueueByBeltCodeAndLockForBeltUser(
      beltCode,
      userId,
      finalStatusArray,
      beltStage,
      orderIds,
      trackingNumbers,
      1,
      0,
      true, // includeTotalCount
    );

    if (queueAndLength === undefined || queueAndLength?.length === 0) {
      if (orderIds && orderIds?.length > 0) {
        const pharmacistReview = await db
          .select({
            reason: beltQueuePharmacistReview.reason,
            ReviewBy: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(beltQueuePharmacistReview)
          .leftJoin(users, eq(beltQueuePharmacistReview.pharmacistId, users.id))
          .where(
            and(
              eq(beltQueuePharmacistReview.status, "DENIED"),
              inArray(beltQueuePharmacistReview.orderId, orderIds),
            ),
          );

        if (pharmacistReview.length > 0) {
          return {
            status: "warning",
            messages: [
              `Order #${orderIds[0]} denied by pharmacist review.`,
              ...(pharmacistReview.map(
                (item) =>
                  `Reason ${item.ReviewBy?.name ? " - " + item.ReviewBy?.name : ""}: ${item.reason}`,
              ) || []),
            ],
          } as Result;
        }

        const [checkItExists] = await db
          .select({
            orderId: beltQueues.orderId,
            lockedForUserId: beltQueues.lockedForUserId,
            skipped: beltQueues.skipped,
            reason: beltQueues.comments,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(beltQueues)
          .leftJoin(users, eq(beltQueues.lockedForUserId, users.id))
          .where(eq(beltQueues.orderId, orderIds[0]))
          .limit(1);

        if (
          checkItExists &&
          checkItExists.lockedForUserId &&
          checkItExists.lockedForUserId !== userId
        ) {
          return {
            status: "warning",
            messages: [
              `Order #${orderIds[0]} is locked ${checkItExists.user?.name ? `for ${checkItExists.user?.name}` : ""}.`,
            ],
          } as Result;
        }

        if (checkItExists && checkItExists.skipped) {
          return {
            status: "warning",
            messages: [
              `Order #${orderIds[0]} is skipped.`,
              `Reason: ${checkItExists.reason}`,
            ],
          } as Result;
        }

        return {
          status: "error",
          messages: [
            `No order #${orderIds[0]} in belt ${beltCode}'s queue.`,
            `Please check order id again.`,
          ],
        } as Result;
      }

      return {
        status: "info",
        messages: [`No orders in belt ${beltCode}'s queue.`],
      } as Result;
    }

    let order;
    let packageIds = [];

    // Check if this is a Lymlight order
    const isLymlightOrder = queueAndLength?.queue[0]?.affiliateId === -1;
    if (isLymlightOrder) {
      order = await getOrderDetailsFromLym(queueAndLength?.queue[0]);
      if (order?.status !== "success") return order as Result;

      packageIds = order?.value?.items
        ?.map(
          (item: any) =>
            item?.legacyId?.split("-")?.[1] ?? item?.packageId ?? undefined,
        )
        .filter((id: any) => id !== undefined);

      order = {
        ...order,
        value: {
          ...order?.value,
          orderId: queueAndLength?.queue[0]?.orderId,
          patientId: queueAndLength?.queue[0]?.patientId,
          patientName: queueAndLength?.queue[0]?.patientName,
        },
      };
    } else {
      // For regular orders, fetch from PharmacyWire
      order = await getOrderDetailsFromPw(
        queueAndLength?.queue[0]?.orderId ?? "",
        queueAndLength?.queue[0]?.patientId ?? "",
      );
      if (order?.status !== "success") return order as Result;

      packageIds = order?.value?.items
        ?.map((item: any) => item?.packageId.split("-")[1] ?? undefined)
        .filter((id: any) => id !== undefined);
    }

    const groupedQueue = await db
      .select({
        orderId: beltQueues.orderId,
        groupId: beltQueues.groupId,
      })
      .from(beltQueues)
      .where(
        and(
          not(eq(beltQueues.orderId, queueAndLength?.queue[0]?.orderId)),
          eq(beltQueues.groupId, queueAndLength?.queue[0]?.groupId ?? "-1"),
        ),
      );
    let groupedQueueAndLength: any = undefined;
    if (groupedQueue.length > 0) {
      groupedQueueAndLength =
        (
          await getQueueByBeltCodeAndLockForBeltUser(
            beltCode,
            userId,
            finalStatusArray,
            beltStage,
            groupedQueue.map((order: any) => order.orderId),
            undefined,
            1,
            0,
            false,
          )
        )?.queue ?? [];

      groupedQueueAndLength = await Promise.all(
        groupedQueueAndLength.map(async (order: any) => {
          let orderDetails: any = undefined;
          if (order.affiliateId === -1) {
            orderDetails = await getOrderDetailsFromLym(order);
            if (orderDetails?.status !== "success") return order as Result;
          } else {
            orderDetails = await getOrderDetailsFromPw(
              order.orderId,
              order.patientId ?? "",
            );
            if (orderDetails?.status !== "success") return order as Result;
          }

          return {
            ...order,
            orderDetails: orderDetails?.value,
          };
        }),
      );
    }

    const groupedPackageIds =
      groupedQueueAndLength?.flatMap((order: any) =>
        order.orderDetails?.items
          ?.map((item: any) => item?.packageId.split("-")[1] ?? undefined)
          .filter((id: any) => id !== undefined),
      ) ?? [];

    const barcodes = await db
      .select({
        barcode: packageBarcodes.barcode,
        packageId: packageBarcodes.packageId,
        pwPackageId: sql`CONCAT("DP-", ${packageBarcodes.packageId})`,
        lymlightPackageId: packageBarcodes.lymlightPackageId,
      })
      .from(packageBarcodes)
      .where(
        or(
          inArray(packageBarcodes.packageId, [
            ...packageIds,
            ...groupedPackageIds,
          ]),
          inArray(packageBarcodes.lymlightPackageId, [
            ...packageIds,
            ...groupedPackageIds,
          ]),
        ),
      );

    try {
      const checkPulled = await db
        .select({
          id: logs.id,
        })
        .from(logs)
        .where(
          and(
            eq(logs.action, `PULL_QUEUE_${beltStage}`),
            eq(logs.orderId, queueAndLength?.queue[0]?.orderId),
            eq(logs.userId, userId),
            gte(logs.createdAt, sql`DATE_SUB(NOW(), INTERVAL 2 MINUTE)`),
          ),
        );

      if (checkPulled.length === 0) {
        const createLog = await db
          .insert(logs)
          .values({
            action: `PULL_QUEUE_${beltStage}`,
            beltCode: beltCode,
            description: `Order ${queueAndLength?.queue[0]?.orderId} pulled to ${beltStage} by ${userName ?? ""}`,
            orderId: queueAndLength?.queue[0]?.orderId,
            userId: userId,
          })
          .execute();
      }
    } catch (error) {
      console.log(error);
    }

    return {
      status: "success",
      value: {
        orderDetails: {
          ...order?.value,
          packagesBarcodes: barcodes,
          batchId: queueAndLength?.queue[0]?.batchId,
          currentOrderIndex: queueAndLength?.queue[0]?.orderId,
        },
        queue: queueAndLength?.queue,
        groupedQueue: groupedQueueAndLength,
        length: queueAndLength?.totalLength || queueAndLength?.length, // Use total count from single query
      },
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["Failed to pull queue"],
    } as Result;
  }
}

export async function pushQueueStage2(
  orderId: string,
  groupOrderIds: string[] | undefined = undefined,
  formData: FormData,
  itemInfos: any | undefined = undefined,
  expectedItems?: any | undefined,
  comment?: string | undefined,
): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication?.user) {
      return {
        status: "error",
        messages: ["You are not authorized to push queue"],
      } as Result;
    }

    if (orderId.length === 0 || formData.get("file") === null)
      return {
        status: "error",
        messages: ["Order ID and image are required"],
      } as Result;

    const beltUser = await getUserById(authentication?.user?.id ?? "-1");

    const [currentQueue] = await db
      .select()
      .from(beltQueues)
      .where(eq(beltQueues.orderId, orderId))
      .limit(1);

    if (!currentQueue)
      return {
        status: "error",
        messages: ["Order not found"],
      } as Result;

    // const groupQueues = await db
    //   .select()
    //   .from(beltQueues)
    //   .where(inArray(beltQueues.groupId, groupOrderIds ?? ["-1"]));

    // Bu işlemi orderId ve groupOrderIds için uygula (hem ana order hem grouped orders için)
    const targetOrderIds = [orderId, ...(groupOrderIds ?? [])];

    const items: {
      orderId: string;
      lotNumbers: any;
      quantity: any;
      packageId: string;
    }[] = [];

    for (const oid of targetOrderIds) {
      const keyPrefix = `${oid}-`;
      const allKeys = Object.keys(itemInfos.scannedCounts ?? {});
      const orderKeys = allKeys.filter(
        (key: string) => key === oid || key.startsWith(keyPrefix),
      );
      const keysToUse =
        orderKeys.length > 0
          ? orderKeys
          : allKeys; /* legacy: key = packageId */
      keysToUse.forEach((key: string) => {
        const packageId = key.startsWith(keyPrefix)
          ? key.slice(keyPrefix.length)
          : key;
        // lotNumbers ve scannedCounts farklı orderId ve packageId'ler için ayrı tutulacak
        items.push({
          orderId: oid,
          lotNumbers: itemInfos.lotNumbers[key],
          quantity: itemInfos.scannedCounts[key],
          packageId,
        });
      });
    }

    let orderItemsDBData: {
      orderId: string;
      lotNumber: string;
      packageId: string;
      legacyId?: string;
      din?: string;
      quantity: number;
      unitPrice: string;
    }[] = [];

    // Aggregate by (orderId, packageId, lotNumber) so we never insert duplicates (PK)
    const rowKey = (o: string, p: string, l: string) =>
      `${o}|${p}|${String(l ?? "").trim()}`;
    const aggregated = new Map<
      string,
      {
        orderId: string;
        packageId: string;
        lotNumber: string;
        quantity: number;
        unitPrice: string;
        legacyId?: string;
        din?: string;
      }
    >();

    items?.forEach((item: any) => {
      const unitPrice =
        expectedItems?.find((e: any) => e.packageId === item.packageId)
          ?.unitPrice ?? "0";
      const din =
        expectedItems?.find((e: any) => e.packageId === item.packageId)?.din ??
        undefined;
      const legacyId =
        expectedItems?.find((e: any) => e.packageId === item.packageId)
          ?.legacyId ?? undefined;

      item?.lotNumbers?.forEach((l: any) => {
        const lotStr = String(l?.lotNumber ?? l ?? "").trim();
        const key = rowKey(item.orderId, item.packageId, lotStr);
        const existing = aggregated.get(key);
        if (existing) {
          existing.quantity += 1;
        } else {
          aggregated.set(key, {
            orderId: item.orderId,
            packageId: item.packageId,
            lotNumber: lotStr,
            quantity: 1,
            unitPrice,
            din,
            legacyId,
          });
        }
      });
    });

    orderItemsDBData = Array.from(aggregated.values()).map((row) => ({
      orderId: row.orderId,
      lotNumber: row.lotNumber,
      packageId: row.packageId,
      legacyId: row.legacyId,
      din: row.din,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
    }));

    const orderItemsTransaction = await db.transaction(async (tx) => {
      const deleteOldItems = await tx
        .delete(orderItems)
        .where(
          inArray(orderItems.orderId, [orderId, ...(groupOrderIds ?? [])]),
        );

      const createNewItems = await tx
        .insert(orderItems)
        .values(orderItemsDBData);
      return createNewItems;
    });

    if (orderItemsTransaction[0].affectedRows === 0)
      return {
        status: "error",
        messages: ["Failed to update lot numbers and quantities to database"],
      } as Result;

    if (expectedItems) {
      const updatedExpectedItems = expectedItems.map((item: any) => ({
        ...item,
      }));
      await db.transaction(async (tx) => {
        const deleteOldItems = await tx
          .delete(orderExpectedItems)
          .where(
            inArray(orderExpectedItems.orderId, [
              orderId,
              ...(groupOrderIds ?? []),
            ]),
          );
        const createNewItems = await tx
          .insert(orderExpectedItems)
          .values(updatedExpectedItems);
        return createNewItems;
      });
    }

    // image
    const imageFile = formData.get("file") as File;
    const imageBuffer = await imageFile.arrayBuffer();
    const rotateImage = await sharp(imageBuffer)
      .jpeg({ quality: 100 })
      .rotate(180)
      .toBuffer();
    const rotateImageBase64 = rotateImage.toString("base64");
    const file = await base64ToFile(
      rotateImageBase64,
      `image_${orderId}_stage1.jpeg`,
      "image/jpeg",
    );

    if (!file) {
      return {
        status: "error",
        messages: ["Failed to convert image to file"],
      } as Result;
    }

    const uploadResponse = await utapi.uploadFiles([...(file ? [file] : [])]);
    const image = uploadResponse.map((file: any) => file.data);

    if (image?.[0] === null || image?.[0] === undefined) {
      return {
        status: "error",
        messages: ["Failed to upload image. Please try again."],
      } as Result;
    }

    // image upload
    const uploadQueue = await db
      .update(beltQueues)
      .set({
        images: image ?? null,
        status: "STAGE2",
        lockedForUserId: null,
        lockedAt: null,
      })
      .where(
        and(
          or(
            eq(beltQueues.orderId, orderId),
            inArray(beltQueues.orderId, groupOrderIds ?? ["-1"]),
          ),
          eq(beltQueues.lockedForUserId, beltUser?.id ?? "-1"),
          eq(beltQueues.status, "STAGE1"),
        ),
      );

    if (uploadQueue[0].affectedRows === 0)
      return {
        status: "error",
        messages: [
          `Failed to push order to stage 2. This order is not locked for you or not in stage 1.`,
        ],
      } as Result;

    if (currentQueue.affiliateId === -1)
      await setLymlightOrderInfo({
        orderId: orderId,
        newStatus: "Final_Check",
        shippingMethod: null, //currentQueue?.shippingMethod,
        trackingNumber: null, //currentQueue?.trackingNumber,
        shippingDate: null, //currentQueue?.updatedAt,
      });
    if (
      currentQueue.affiliateId === -1 &&
      groupOrderIds &&
      groupOrderIds.length > 0
    ) {
      for (const groupOrderId of groupOrderIds) {
        await setLymlightOrderInfo({
          orderId: groupOrderId,
          newStatus: "Final_Check",
          shippingMethod: null, //currentQueue?.shippingMethod,
          trackingNumber: null, //currentQueue?.trackingNumber,
          shippingDate: null, //currentQueue?.updatedAt,
        });
      }
    }

    try {
      const createLog = await db
        .insert(logs)
        .values([
          {
            action: "PUSH_QUEUE_STAGE2",
            orderId: orderId,
            description: `Order ${orderId} pushed to queue by ${authentication?.user?.name ?? ""}`,
            userId: authentication?.user?.id,
            beltCode: beltUser?.beltCode ?? "",
          },
          ...(groupOrderIds ?? []).map((groupOrderId: string) => ({
            action: "PUSH_QUEUE_STAGE2",
            orderId: groupOrderId,
            description: `Order ${groupOrderId} pushed to queue by ${authentication?.user?.name ?? ""}`,
            userId: authentication?.user?.id,
            beltCode: beltUser?.beltCode ?? "",
          })),
        ])
        .execute();
    } catch (error) {
      console.log(error);
    }

    revalidatePath(`/belt/${beltUser?.beltCode}`);

    return {
      status: "success",
      messages: [
        `Order ${orderId}${groupOrderIds && groupOrderIds.length > 0 ? ` and ${groupOrderIds.join(", ")}` : ""} pushed to stage 2`,
      ],
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["Failed to push queue"],
    } as Result;
  }
}

export async function pushQueueStage3(
  orderId: string,
  groupOrderIds: string[] | undefined = undefined,
  formData: FormData,
  comment?: string | undefined,
): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication?.user) {
      return {
        status: "error",
        messages: ["You are not authorized to push queue"],
      } as Result;
    }

    if (orderId.length === 0 || formData.get("file") === null)
      return {
        status: "error",
        messages: ["Order ID and image are required"],
      } as Result;

    const beltUser = await getUserById(authentication?.user?.id ?? "-1");

    const currentQueue = await db.query.beltQueues.findFirst({
      where: eq(beltQueues.orderId, orderId),
    });

    if (!currentQueue)
      return {
        status: "error",
        messages: ["Order not found"],
      } as Result;

    const imageFile = formData.get("file") as File;
    const imageBuffer = await imageFile.arrayBuffer();
    const rotateImage = await sharp(imageBuffer)
      .jpeg({ quality: 100 })
      .rotate(180)
      .toBuffer();
    const rotateImageBase64 = rotateImage.toString("base64");
    const file = await base64ToFile(
      rotateImageBase64,
      `image_${orderId}_stage2.jpeg`,
      "image/jpeg",
    );

    if (!file) {
      return {
        status: "error",
        messages: ["Failed to convert image to file"],
      } as Result;
    }

    const uploadResponse = await utapi.uploadFiles([...(file ? [file] : [])]);
    const image = uploadResponse.map((file: any) => file.data);

    if (image?.[0] === null || image?.[0] === undefined) {
      return {
        status: "error",
        messages: ["Failed to upload image. Please try again."],
      } as Result;
    }

    const uploadQueue = await db
      .update(beltQueues)
      .set({
        images: [...(image ?? []), ...(currentQueue?.images ?? [])],
        status: "STAGE3",
        lockedForUserId: null,
        lockedAt: null,
      })
      .where(
        and(
          or(
            eq(beltQueues.orderId, orderId),
            inArray(beltQueues.orderId, groupOrderIds ?? ["-1"]),
          ),
          eq(beltQueues.lockedForUserId, beltUser?.id ?? "-1"),
          eq(beltQueues.status, "STAGE2"),
        ),
      );

    if (uploadQueue[0].affectedRows === 0)
      return {
        status: "error",
        messages: [
          `Failed to push order to stage 3. This order is not locked for you or not in stage 2.`,
        ],
      } as Result;

    try {
      const createLog = await db
        .insert(logs)
        .values([
          {
            action: "PUSH_QUEUE_STAGE3",
            orderId: orderId,
            description: `Order ${orderId} pushed to queue by ${authentication?.user?.name ?? ""}`,
            userId: authentication?.user?.id,
            beltCode: beltUser?.beltCode ?? "",
          },
          ...(groupOrderIds ?? []).map((groupOrderId: string) => ({
            action: "PUSH_QUEUE_STAGE3",
            orderId: groupOrderId,
            description: `Order ${groupOrderId} pushed to queue by ${authentication?.user?.name ?? ""}`,
            userId: authentication?.user?.id,
            beltCode: beltUser?.beltCode ?? "",
          })),
        ])
        .execute();
    } catch (error) {
      console.log(error);
    }

    revalidatePath(`/belt/${beltUser?.beltCode}`);

    return {
      status: "success",
      messages: [
        `Order ${orderId}${groupOrderIds && groupOrderIds.length > 0 ? ` and ${groupOrderIds.join(", ")}` : ""} pushed to stage 3`,
      ],
    } as Result;
  } catch (error) {
    return {
      status: "error",
      messages: ["Failed to push queue"],
    } as Result;
  }
}

export async function pushQueueCompleted(
  orderId: string,
  groupOrderIds: string[] | undefined = undefined,
  formData: FormData,
  cageCode: string,
  comment?: string | undefined,
): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication?.user) {
      return {
        status: "error",
        messages: ["You are not authorized to push queue."],
      } as Result;
    }

    if (
      orderId.length === 0 ||
      formData.get("file") === null ||
      cageCode.length === 0
    )
      return {
        status: "error",
        messages: ["Order ID, image and cage code are required."],
      } as Result;

    const beltUser = await getUserById(authentication?.user?.id ?? "-1");

    const currentQueue = await db.query.beltQueues.findFirst({
      where: eq(beltQueues.orderId, orderId),
    });

    if (!currentQueue)
      return {
        status: "error",
        messages: ["Order not found or already completed."],
      } as Result;

    const imageFile = formData.get("file") as File;
    const imageBuffer = await imageFile.arrayBuffer();
    const rotateImage = await sharp(imageBuffer)
      .jpeg({ quality: 100 })
      .rotate(180)
      .toBuffer();
    const rotateImageBase64 = rotateImage.toString("base64");
    const file = await base64ToFile(
      rotateImageBase64,
      `image_${orderId}_stage3.jpeg`,
      "image/jpeg",
    );

    if (!file) {
      return {
        status: "error",
        messages: ["Failed to convert image to file. Please take a new image and try again."],
      } as Result;
    }

    const uploadResponse = await utapi.uploadFiles([...(file ? [file] : [])]);
    const image = uploadResponse.map((file: any) => file.data);

    if (image?.[0] === null || image?.[0] === undefined) {
      return {
        status: "error",
        messages: ["Failed to upload image. Please take a new image and try again."],
      } as Result;
    }

    const winnipegNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Winnipeg" }),
    );

    const uploadQueue = await db
      .update(beltQueues)
      .set({
        images: [...(image ?? []), ...(currentQueue?.images ?? [])],
        cageCode: cageCode,
        status: "COMPLETED",
        lockedForUserId: null,
        lockedAt: null,
        shippedAt: winnipegNow,
      })
      .where(
        and(
          or(
            eq(beltQueues.orderId, orderId),
            inArray(beltQueues.orderId, groupOrderIds ?? ["-1"]),
          ),
          eq(beltQueues.lockedForUserId, beltUser?.id ?? "-1"),
          eq(beltQueues.status, "STAGE3"),
        ),
      );

    if (uploadQueue[0].affectedRows === 0)
      return {
        status: "error",
        messages: [
          `Failed to push order to completed. This order is not locked for you or not in stage 3.`,
        ],
      } as Result;

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

    if (currentQueue.affiliateId === -1)
      await setLymlightOrderInfo({
        orderId: orderId,
        newStatus:
          getPharmacistReview.count >= 2 ? "In_Transit" : "Final_Check",
        shippingMethod:
          getPharmacistReview.count >= 2 ? currentQueue?.shippingMethod : null,
        trackingNumber:
          getPharmacistReview.count >= 2 ? currentQueue?.trackingNumber : null,
        shippingDate:
          getPharmacistReview.count >= 2 ? currentQueue?.updatedAt : null,
      });

    if (
      currentQueue.affiliateId === -1 &&
      groupOrderIds &&
      groupOrderIds.length > 0
    ) {
      for (const groupOrderId of groupOrderIds) {
        await setLymlightOrderInfo({
          orderId: groupOrderId,
          newStatus:
            getPharmacistReview.count >= 2 ? "In_Transit" : "Final_Check",
          shippingMethod:
            getPharmacistReview.count >= 2
              ? currentQueue?.shippingMethod
              : null,
          trackingNumber:
            getPharmacistReview.count >= 2
              ? currentQueue?.trackingNumber
              : null,
          shippingDate:
            getPharmacistReview.count >= 2 ? currentQueue?.updatedAt : null,
        });
      }
    }

    // Update Lymlight inventory - reduce stock for shipped items
    // try {
    //   const items = await db
    //     .select({
    //       packageId: orderItems.packageId,
    //       quantity: orderItems.quantity,
    //     })
    //     .from(orderItems)
    //     .where(
    //       or(
    //         eq(orderItems.orderId, orderId),
    //         inArray(orderItems.orderId, groupOrderIds ?? ["-1"]),
    //       ),
    //     );

    //   if (items.length > 0) {
    //     const inventoryResult = await updateLymlightInventory(items);
    //     if (!inventoryResult.success) {
    //       console.log("Inventory update errors:", inventoryResult.errors);
    //     }
    //   }
    // } catch (error) {
    //   console.log("Failed to update Lymlight inventory:", error);
    // }

    try {
      const createLog = await db
        .insert(logs)
        .values([
          {
            action: "PUSH_QUEUE_COMPLETED",
            orderId: orderId,
            description: `Order ${orderId} completed by ${authentication?.user?.name ?? ""}`,
            userId: authentication?.user?.id,
            beltCode: beltUser?.beltCode ?? "",
          },
          ...(groupOrderIds ?? []).map((groupOrderId: string) => ({
            action: "PUSH_QUEUE_COMPLETED",
            orderId: groupOrderId,
            description: `Order ${groupOrderId} completed by ${authentication?.user?.name ?? ""}`,
            userId: authentication?.user?.id,
            beltCode: beltUser?.beltCode ?? "",
          })),
        ])
        .execute();
    } catch (error) {
      console.log(error);
    }

    await setAllUnlockedBeltUserInQueue(beltUser?.id ?? "-1");

    revalidatePath(`/belt/${beltUser?.beltCode}`);

    return {
      status: "success",
      messages: [
        `Order ${orderId}${groupOrderIds && groupOrderIds.length > 0 ? ` and ${groupOrderIds.join(", ")}` : ""} completed`,
      ],
    } as Result;
  } catch (error) {
    return {
      status: "error",
      messages: ["Failed to push queue"],
    } as Result;
  }
}

// Non-medication package IDs that don't have monographs
const NON_MED_PACKAGE_IDS = ["17437", "17388", "17372", "17440", "17612"];

export async function getMonographsForPackages(
  packageIds: string[],
): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (!authentication?.user) {
      return { status: "error", messages: ["Not authenticated"] } as Result;
    }

    // Convert DP-XXXXX to just the numeric ID
    const numericIds = packageIds
      .map((id) => {
        const match = id.match(/\d+/);
        return match ? parseInt(match[0]) : null;
      })
      .filter((id): id is number => id !== null);

    if (numericIds.length === 0) {
      return { status: "success", value: [] } as Result;
    }

    const extras = await db
      .select({
        packageId: packageExtras.packageId,
        monographUrl: packageExtras.monographUrl,
      })
      .from(packageExtras)
      .where(inArray(packageExtras.packageId, numericIds));

    return { status: "success", value: extras } as Result;
  } catch (error) {
    console.log("Error fetching monographs:", error);
    return {
      status: "error",
      messages: ["Failed to fetch monographs"],
    } as Result;
  }
}

export async function uploadMonograph(
  packageId: string,
  formData: FormData,
): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (!authentication?.user) {
      return { status: "error", messages: ["Not authenticated"] } as Result;
    }

    const numericId = parseInt(packageId.replace(/\D/g, ""));
    if (isNaN(numericId)) {
      return { status: "error", messages: ["Invalid package ID"] } as Result;
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { status: "error", messages: ["No file provided"] } as Result;
    }

    // Upload to UploadThing
    const uploadResponse = await utapi.uploadFiles([file]);
    const uploadedFile = uploadResponse[0]?.data;

    if (!uploadedFile?.key) {
      return {
        status: "error",
        messages: ["Failed to upload monograph"],
      } as Result;
    }

    // Check if package_extras record exists
    const [existing] = await db
      .select()
      .from(packageExtras)
      .where(eq(packageExtras.packageId, numericId))
      .limit(1);

    if (existing) {
      // Update existing record
      await db
        .update(packageExtras)
        .set({ monographUrl: uploadedFile.key })
        .where(eq(packageExtras.packageId, numericId));
    } else {
      // Insert new record
      await db.insert(packageExtras).values({
        packageId: numericId,
        monographUrl: uploadedFile.key,
      });
    }

    return {
      status: "success",
      value: { monographUrl: uploadedFile.key },
      messages: ["Monograph uploaded successfully"],
    } as Result;
  } catch (error) {
    console.log("Error uploading monograph:", error);
    return {
      status: "error",
      messages: ["Failed to upload monograph"],
    } as Result;
  }
}

export async function createPackageExtras(packageId: string): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (!authentication?.user) {
      return { status: "error", messages: ["Not authenticated"] } as Result;
    }

    // Extract numeric ID from DP-XXXXX or PP-XXXXX format, or just use raw number
    const numericId = parseInt(packageId.replace(/\D/g, ""));
    if (isNaN(numericId)) {
      return { status: "error", messages: ["Invalid package ID"] } as Result;
    }

    // Check if already exists
    const [existing] = await db
      .select()
      .from(packageExtras)
      .where(eq(packageExtras.packageId, numericId))
      .limit(1);

    if (existing) {
      return {
        status: "success",
        messages: ["Package extras already exists"],
      } as Result;
    }

    // Create new row
    await db.insert(packageExtras).values({
      packageId: numericId,
    });

    return {
      status: "success",
      messages: ["Package extras created successfully"],
    } as Result;
  } catch (error) {
    console.log("Error creating package extras:", error);
    return {
      status: "error",
      messages: ["Failed to create package extras"],
    } as Result;
  }
}

export async function fetchAndStoreMonograph(
  pwMonographUrl: string,
  packageId: string,
): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (!authentication?.user) {
      return { status: "error", messages: ["Not authenticated"] } as Result;
    }

    // Extract numeric ID from DP-XXXXX format
    const numericId = parseInt(packageId.replace(/\D/g, ""));
    if (isNaN(numericId)) {
      return { status: "error", messages: ["Invalid package ID"] } as Result;
    }

    // Check if it's a non-med package
    if (NON_MED_PACKAGE_IDS.includes(numericId.toString())) {
      return {
        status: "error",
        messages: ["This package does not have a monograph"],
      } as Result;
    }

    // Fetch the PDF from PharmacyWire
    const response = await fetch(pwMonographUrl);
    if (!response.ok) {
      return {
        status: "error",
        messages: ["Failed to fetch monograph from PharmacyWire"],
      } as Result;
    }

    const pdfBuffer = await response.arrayBuffer();
    const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
    const pdfFile = new File([pdfBlob], `monograph_${numericId}.pdf`, {
      type: "application/pdf",
    });

    // Upload to UploadThing
    const uploadResponse = await utapi.uploadFiles([pdfFile]);
    const uploadedFile = uploadResponse[0]?.data;

    if (!uploadedFile?.key) {
      return {
        status: "error",
        messages: ["Failed to upload monograph"],
      } as Result;
    }

    // Check if package_extras record exists
    const [existing] = await db
      .select()
      .from(packageExtras)
      .where(eq(packageExtras.packageId, numericId))
      .limit(1);

    if (existing) {
      // Update existing record
      await db
        .update(packageExtras)
        .set({ monographUrl: uploadedFile.key })
        .where(eq(packageExtras.packageId, numericId));
    } else {
      // Insert new record
      await db.insert(packageExtras).values({
        packageId: numericId,
        monographUrl: uploadedFile.key,
      });
    }

    return {
      status: "success",
      value: { monographUrl: uploadedFile.key },
      messages: ["Monograph saved successfully"],
    } as Result;
  } catch (error) {
    console.log("Error storing monograph:", error);
    return {
      status: "error",
      messages: ["Failed to store monograph"],
    } as Result;
  }
}

export async function addBarcodeToPackage(
  barcode: string,
  packageId: number,
  isLymlightPackage: boolean = false,
): Promise<Result> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        status: "error",
        messages: ["Unauthorized"],
      } as Result;
    }

    // Check if barcode already exists for this package
    const existingBarcode = await db
      .select()
      .from(packageBarcodes)
      .where(
        and(
          eq(packageBarcodes.packageId, packageId),
          eq(packageBarcodes.barcode, barcode),
        ),
      );

    if (existingBarcode.length > 0) {
      return {
        status: "error",
        messages: ["This barcode already exists for this package"],
      } as Result;
    }

    // Insert new barcode
    await db.insert(packageBarcodes).values({
      packageId: isLymlightPackage ? undefined : packageId,
      lymlightPackageId: isLymlightPackage
        ? "PP-" + packageId.toString()
        : null,
      barcode: barcode,
    });

    // Log the action
    await db.insert(logs).values({
      action: "ADD_BARCODE",
      description: `Barcode "${barcode}" added to package ${packageId} by ${session.user?.name ?? session.user?.email ?? "Unknown"}`,
      userId: session.user?.id,
    });

    return {
      status: "success",
      messages: ["Barcode added successfully"],
    } as Result;
  } catch (error) {
    console.log("Error adding barcode:", error);
    return {
      status: "error",
      messages: ["Failed to add barcode"],
    } as Result;
  }
}
