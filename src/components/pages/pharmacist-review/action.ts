"use server";
import { getQueueForPharmacist } from "@/server/controller/queues";
import { auth } from "@/lib/auth";
import { getUserById } from "@/server/controller/users";
import { Result } from "@/lib/types";
import { db } from "@/db/db";
import { and, eq, gte, inArray, isNull, not, or, sql } from "drizzle-orm";
import {
  beltQueuePharmacistReview,
  beltQueues,
  logs,
  pharmacistReviewStatusTypes,
  users,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import {
  GetAllPhoneNumbersForSmsNotification,
  PharmacistDeniedSmsNotificationValue,
} from "../management/process-view/pharmacist-denied-sms-notification/actions";
import { messageBySms } from "@/server/smsSender";
import { pharmacistDeniedSlackMessage } from "@/server/slack";
import { setLymlightOrderInfo } from "@/server/lymlight";
import { headers } from "next/headers";
// import { getFiles } from "@/components/common/file/get";

export async function pullQueueForReview(
  orderIds: string[] | undefined,
  groupedOrderIds: string[] | undefined = undefined,
  activeOrderGroupId: number | undefined = undefined,
  filter: {
    fromDate?: Date | undefined;
  } | undefined = undefined,
  limit: number = 5,
  offset: number = 0,
): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication?.user) {
      return {
        status: "error",
        messages: ["You are not authorized to pull queue"],
      } as Result;
    }

    const pharmacistUser = await getUserById(authentication?.user?.id ?? "-1");

    if (!pharmacistUser) {
      return {
        status: "error",
        messages: ["Pharmacist not found"],
      } as Result;
    }

    const queueAndLength: any = await getQueueForPharmacist(
      pharmacistUser.id,
      ["STAGE2", "STAGE3", "COMPLETED"],
      orderIds,
      filter,
      limit,
      offset,
    );

    if (queueAndLength === undefined || queueAndLength?.length === 0) {
      return {
        status: "error",
        messages: ["No orders in queue"],
      } as Result;
    }

    const seenGroupIds = new Set<string | number>();
    const queueAndLengthRemoveSameGroup = queueAndLength?.queue?.filter(
      (o: any) => {
        if (o.groupId === "-1" || o.groupId === undefined || o.groupId === null)
          return true;
        const gid =
          typeof o.groupId === "number"
            ? o.groupId
            : Number(o.groupId);
        const normalizedKey = Number.isNaN(gid) ? o.groupId : gid;
        if (seenGroupIds.has(normalizedKey)) return false;
        seenGroupIds.add(normalizedKey);
        if (groupedOrderIds && groupedOrderIds.length > 0) {
          if (groupedOrderIds.includes(o.orderId)) return false;
        }
        return true;
      },
    );

    const groupedQueue = await db
      .select({
        orderId: beltQueues.orderId,
        groupId: beltQueues.groupId,
      })
      .from(beltQueues)
      .where(
        and(
          not(isNull(beltQueues.groupId)),
          // Exclude orders already in the current queue
          queueAndLengthRemoveSameGroup &&
            queueAndLengthRemoveSameGroup.length > 0
            ? not(
              inArray(
                beltQueues.orderId,
                queueAndLengthRemoveSameGroup.map((o: any) => o.orderId),
              ),
            )
            : undefined,
          or(
            // Include only valid group IDs (excluding "-1", undefined, or null)
            queueAndLengthRemoveSameGroup &&
              queueAndLengthRemoveSameGroup.length > 0
              ? inArray(
                beltQueues.groupId,
                queueAndLengthRemoveSameGroup
                  .filter(
                    (o: any) =>
                      o.groupId !== "-1" &&
                      o.groupId !== undefined &&
                      o.groupId !== null,
                  )
                  .map((o: any) => o.groupId),
              )
              : undefined,
            activeOrderGroupId
              ? eq(beltQueues.groupId, activeOrderGroupId)
              : undefined,
          ),
        ),
      );

    let groupedQueueResult: any = undefined;
    if (groupedQueue.length > 0) {
      groupedQueueResult =
        (
          await getQueueForPharmacist(
            pharmacistUser.id,
            ["STAGE2", "STAGE3", "COMPLETED"],
            groupedQueue.map((order: any) => order.orderId),
            undefined,
            50,
            0,
          )
        )?.queue ?? [];
    }

    try {
      const checkPulled = await db
        .select({
          id: logs.id,
        })
        .from(logs)
        .where(
          and(
            eq(logs.action, `PULL_QUEUE_REVIEW`),
            eq(logs.orderId, queueAndLength?.queue[0]?.orderId),
            eq(logs.userId, authentication.user?.id ?? "-1"),
            gte(logs.createdAt, sql`DATE_SUB(NOW(), INTERVAL 1 MINUTE)`),
          ),
        );

      if (checkPulled.length === 0) {
        const createLog = await db
          .insert(logs)
          .values([
            {
              action: "PULL_QUEUE_REVIEW",
              beltCode: queueAndLength?.queue[0]?.beltCode,
              description: `Order ${queueAndLength?.queue[0]?.orderId} pulled for review by ${authentication.user?.name}`,
              orderId: queueAndLength?.queue[0]?.orderId,
              userId: authentication.user?.id,
            },
            ...(groupedQueueResult?.map((o: any) => ({
              action: "PULL_QUEUE_REVIEW",
              beltCode: o.beltCode,
              description: `Order ${o.orderId} pulled for review by ${authentication.user?.name}`,
              orderId: o.orderId,
              userId: authentication.user?.id,
            })) ?? []),
          ])
          .execute();
      }
    } catch (error) {
      console.log(error);
    }

    // const imagesKeys: Array<any> = await queueAndLength.queue
    //   .map((item: any) => item.images)
    //   .flat()
    //   .map((item: any) => item.key);

    // const imagesPublic = await getFiles(imagesKeys, 60 * 60);

    // const queueWithPublicImages = queueAndLength.queue.map((item: any) => ({
    //   ...item,
    //   images: item.images.map((image: any) => ({
    //     ...image,
    //     publicUrl: imagesPublic.value?.find(
    //       (item: any) => item.key === image.key
    //     )?.url,
    //   })),
    // }));
    return {
      status: "success",
      value: {
        queue: queueAndLengthRemoveSameGroup,
        groupedQueue: groupedQueueResult,
        length: queueAndLength?.length,
      },
    } as Result;
  } catch (error) {
    return {
      status: "error",
      messages: ["Failed to pull queue"],
    } as Result;
  }
}

const AllowedBeltCodes = "C";
export async function pushQueueReview(
  orderId: string,
  groupedOrderIds: string[] | undefined = undefined,
  review: (typeof pharmacistReviewStatusTypes)[number],
  comment: string | undefined = undefined,
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

    if (orderId.length === 0)
      return {
        status: "error",
        messages: ["Order ID is required"],
      } as Result;

    const pharmacistUser = await getUserById(authentication?.user?.id ?? "-1");

    if (!pharmacistUser) {
      return {
        status: "error",
        messages: ["Pharmacist not found"],
      } as Result;
    }

    const currentQueue = await db.query.beltQueues.findFirst({
      where: eq(beltQueues.orderId, orderId),
    });

    if (!currentQueue)
      return {
        status: "error",
        messages: ["Order not found"],
      } as Result;

    const reviews = await db
      .select({
        orderId: beltQueuePharmacistReview.orderId,
        pharmacistId: beltQueuePharmacistReview.pharmacistId,
        status: beltQueuePharmacistReview.status,
        reason: beltQueuePharmacistReview.reason,
        ReviewBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        createdAt: beltQueuePharmacistReview.createdAt,
        updatedAt: beltQueuePharmacistReview.updatedAt,
      })
      .from(beltQueuePharmacistReview)
      .innerJoin(users, eq(beltQueuePharmacistReview.pharmacistId, users.id))
      .where(
        and(
          or(
            eq(beltQueuePharmacistReview.orderId, orderId),
            //   groupedOrderIds && groupedOrderIds.length > 0
            //     ? inArray(beltQueuePharmacistReview.orderId, groupedOrderIds)
            //     : undefined,
          ),
          not(
            eq(
              beltQueuePharmacistReview.pharmacistId,
              pharmacistUser?.id ?? "-1",
            ),
          ),
        ),
      );

    const isAlreadyDenied = reviews.some(
      (review) => review.status === "DENIED",
    );

    const approvedCount = reviews.filter(
      (review) => review.status === "APPROVED",
    ).length;

    const uploadQueue = await db.transaction(async (tx) => {
      const [deletePharmacistReview] = await db
        .delete(beltQueuePharmacistReview)
        .where(
          and(
            or(
              eq(beltQueuePharmacistReview.orderId, orderId),
              groupedOrderIds && groupedOrderIds.length > 0
                ? inArray(beltQueuePharmacistReview.orderId, groupedOrderIds)
                : undefined,
            ),
            eq(
              beltQueuePharmacistReview.pharmacistId,
              pharmacistUser?.id ?? "-1",
            ),
          ),
        );

      const reviewStatus: (typeof pharmacistReviewStatusTypes)[number] =
        review === "APPROVED" ? "APPROVED" : "DENIED";

      const [insertPharmacistReview] = await db
        .insert(beltQueuePharmacistReview)
        .values([
          {
            orderId: orderId,
            pharmacistId: pharmacistUser.id,
            status: reviewStatus,
            reason: comment,
          },
          ...(groupedOrderIds?.map((o: string) => ({
            orderId: o,
            pharmacistId: pharmacistUser.id,
            status: reviewStatus,
            reason: comment,
          })) ?? []),
        ])
        .execute();

      if (insertPharmacistReview.affectedRows === 0)
        return {
          status: "error",
          messages: ["Failed to insert pharmacist review"],
        } as Result;

      if (!isAlreadyDenied && review === "DENIED") {
        const [updateQueue] = await db
          .update(beltQueues)
          .set({
            status: "FAILED",
          })
          .where(
            or(
              eq(beltQueues.orderId, orderId),
              groupedOrderIds && groupedOrderIds.length > 0
                ? inArray(beltQueues.orderId, groupedOrderIds)
                : undefined,
            ),
          );

        if (updateQueue.affectedRows === 0)
          return {
            status: "error",
            messages: ["Failed to update queue status"],
          } as Result;
      }

      return {
        status: "success",
        messages: [
          `Order ${orderId} ${review === "APPROVED" ? "approved" : "denied"}`,
        ],
      } as Result;
    });

    if (uploadQueue.status === "error") return uploadQueue;

    if (review !== "APPROVED" && !isAlreadyDenied) {
      const phoneNumberList = await GetAllPhoneNumbersForSmsNotification();
      phoneNumberList.value?.list.forEach(
        async (item: PharmacistDeniedSmsNotificationValue) => {
          await messageBySms(
            `Belt ${AllowedBeltCodes}: Order id ${orderId}${groupedOrderIds && groupedOrderIds.length > 0 ? ` and ${groupedOrderIds.join(", ")}` : ""} is denied by ${authentication.user?.name}\n \nReason: ${comment ?? "No reason provided"}`,
            item.phoneNumber,
          );
        },
      );
      const response = await pharmacistDeniedSlackMessage(
        `Belt ${AllowedBeltCodes}: Order id ${orderId}${groupedOrderIds && groupedOrderIds.length > 0 ? ` and ${groupedOrderIds.join(", ")}` : ""} is denied by ${authentication.user?.name}\n \nReason: ${comment ?? "No reason provided"}`,
      );
      if (!response?.ok) console.error(response, "\nOrder id->", orderId);
    }

    if (
      review === "APPROVED" &&
      approvedCount >= 1 &&
      currentQueue.affiliateId === -1 &&
      ["STAGE2", "STAGE3", "COMPLETED"].includes(
        currentQueue.status ?? "STAGE1",
      )
    ) {
      await setLymlightOrderInfo({
        orderId: orderId,
        newStatus: "In_Transit",
        shippingMethod:
          currentQueue.status !== "COMPLETED"
            ? null
            : currentQueue?.shippingMethod,
        trackingNumber:
          currentQueue.status !== "COMPLETED"
            ? null
            : currentQueue?.trackingNumber,
        shippingDate:
          currentQueue.status !== "COMPLETED" ? null : currentQueue?.updatedAt,
      });
    }

    if (
      review === "APPROVED" &&
      approvedCount >= 1 &&
      currentQueue.affiliateId === -1 &&
      ["STAGE2", "STAGE3", "COMPLETED"].includes(
        currentQueue.status ?? "STAGE1",
      )
    ) {
      for (const groupOrderId of groupedOrderIds ?? []) {
        await setLymlightOrderInfo({
          orderId: groupOrderId,
          newStatus: "In_Transit",
          shippingMethod:
            currentQueue.status !== "COMPLETED"
              ? null
              : currentQueue?.shippingMethod,
          trackingNumber:
            currentQueue.status !== "COMPLETED"
              ? null
              : currentQueue?.trackingNumber,
          shippingDate:
            currentQueue.status !== "COMPLETED"
              ? null
              : currentQueue?.updatedAt,
        });
      }
    }

    try {
      const createLog = await db
        .insert(logs)
        .values([
          {
            action:
              "PUSH_QUEUE_REVIEW_" +
              (review === "DENIED" ? "DENIED" : "APPROVED"),
            orderId: orderId,
            description: `Order ${orderId} ${review === "APPROVED" ? "approved" : "denied"} ${review === "DENIED" ? `with reason: ${comment ?? "N/A"}` : ""
              } by ${authentication.user?.name}`,
            userId: authentication.user?.id,
            beltCode: currentQueue?.beltCode ?? "",
          },
          ...(groupedOrderIds?.map((o: string) => ({
            action:
              "PUSH_QUEUE_REVIEW_" +
              (review === "DENIED" ? "DENIED" : "APPROVED"),
            orderId: o,
            description: `Order ${o} ${review === "APPROVED" ? "approved" : "denied"} ${review === "DENIED" ? `with reason: ${comment ?? "N/A"}` : ""
              } by ${authentication.user?.name}`,
            userId: authentication.user?.id,
            beltCode: currentQueue?.beltCode ?? "",
          })) ?? []),
        ])
        .execute();
    } catch (error) {
      console.log(error);
    }

    revalidatePath(`/pharmacist-review`);

    return {
      status: "success",
      value: {
        orderId,
        groupedOrderIds,
        review,
      },
      messages: [
        `Order ${orderId}${groupedOrderIds && groupedOrderIds.length > 0 ? ` and ${groupedOrderIds.join(", ")}` : ""} ${review === "APPROVED" ? "approved" : "denied"}`,
      ],
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["Failed to push queue review"],
    } as Result;
  }
}
