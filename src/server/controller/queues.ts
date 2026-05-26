import { db } from "@/db/db";
import {
  beltQueuePharmacistReview,
  beltQueues,
  beltQueueStatusTypes,
  drugs,
  orderExpectedItems,
  orderItems,
  packages,
  pharmacistReviewStatusTypes,
  user,
} from "@/db/schema";
import {
  and,
  count,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lte,
  not,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import type { ProcessViewItemStatus } from "@/lib/process-view-item-status";
import { PROCESS_VIEW_ITEM_STATUS_ANY } from "@/lib/process-view-item-status";

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

function beltQueueMatchesItemStatusFilter(
  itemStatus: ProcessViewItemStatus,
  expectedItems: Array<{
    packageId?: string | number | null;
    legacyId?: string | number | null;
    din?: string | number | null;
    description?: string | null;
  }>,
  metadata: unknown,
) {
  if (itemStatus === PROCESS_VIEW_ITEM_STATUS_ANY) return true;
  if (expectedItems.length === 0) return false;

  const orderedItems = getOrderedItems(metadata);
  const specialItems = getSpecialItems(metadata);
  const receivedItems = getReceivedItems(metadata);

  let prepDone = 0;
  let specialOnlyLines = 0;
  let receivedDone = 0;

  for (const expectedItem of expectedItems) {
    const key = getOrderedItemKey(expectedItem);
    const isOrdered = Boolean(orderedItems[key]);
    const isSpecial = Boolean(specialItems[key]);
    const isSpecialOnly = isSpecial && !isOrdered;

    if (isOrdered || isSpecial) prepDone += 1;
    if (isSpecialOnly) specialOnlyLines += 1;
    if (receivedItems[key]) receivedDone += 1;
  }

  switch (itemStatus) {
    case "FULL_PREP":
      return prepDone === expectedItems.length;
    case "FULL_ORDERED_ONLY":
      return prepDone === expectedItems.length && specialOnlyLines === 0;
    case "FULL_SPECIAL_ONLY":
      return specialOnlyLines === expectedItems.length;
    case "FULL_RECEIVED":
      return receivedDone === expectedItems.length;
    case "MISSING_PREP":
      return prepDone < expectedItems.length;
    case "MISSING_RECEIVE":
      return prepDone === expectedItems.length && receivedDone < expectedItems.length;
    case "ANY":
    default:
      return true;
  }
}

export async function getQueueByBeltCode(
  beltCode: String,
  status: Array<(typeof beltQueueStatusTypes)[number]> | undefined = undefined,
  pharmacistReviewStatus:
    | Array<(typeof pharmacistReviewStatusTypes)[number]>
    | undefined = undefined,
  filter: {
    search?: string | undefined;
    isSkipped?: boolean | undefined;
  },
  getLogs: boolean | undefined = false,
  limit: number = 15,
  offset: number = 0,
) {
  try {
    const [countQueue] = await db
      .select({
        length: count(),
      })
      .from(beltQueues)
      .where(
        and(
          or(eq(beltQueues.beltCode, beltCode?.charAt(0))),
          status?.length ? inArray(beltQueues.status, status) : undefined,
          filter.search
            ? or(
              like(beltQueues.orderId, `%${filter.search}%`),
              like(beltQueues.patientId, `%${filter.search}%`),
              like(beltQueues.trackingNumber, `%${filter.search}%`),
            )
            : undefined,
          filter.isSkipped
            ? eq(beltQueues.skipped, filter.isSkipped)
            : undefined,
        ),
      )
      .execute();

    const queue = await db.query.beltQueues
      .findMany({
        limit: limit,
        offset: offset,
        with: {
          BoxSize: {
            columns: {
              id: true,
              name: true,
              type: true,
              h: true,
              w: true,
              l: true,
              unit: true,
              description: true,
            },
          },
          Affiliate: {
            columns: {
              id: true,
              code: true,
              name: true,
              pwAuthPassword: false,
              pwAuthUsername: false,
              pwLocal: false,
              category: true,
              status: true,
              shippingPreference: true,
            },
          },

          LockedForBeltUser: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },

          SkippedBy: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          Logs:
            getLogs && getLogs === true
              ? {
                with: {
                  User: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                columns: {
                  id: true,
                  action: true,
                  description: true,
                  createdAt: true,
                },
                // orderBy: (log, { desc }) => [desc(log.createdAt)],
              }
              : undefined,
        },
        where: (queue, { eq, inArray, and }) =>
          and(
            or(eq(queue.beltCode, beltCode?.charAt(0))),
            status?.length ? inArray(queue.status, status) : undefined,
            filter.search
              ? or(
                like(queue.orderId, `%${filter.search}%`),
                like(queue.patientId, `%${filter.search}%`),
                like(queue.trackingNumber, `%${filter.search}%`),
              )
              : undefined,
            filter.isSkipped ? eq(queue.skipped, filter.isSkipped) : undefined,
          ),
        orderBy: (queue, { asc, desc }) => [
          // asc(queue.batchId),
          desc(queue.labelCreatedAt),
        ],
      })
      .execute();

    const pharmacistReview = await db
      .select({
        orderId: beltQueues.orderId,
        status: beltQueuePharmacistReview.status,
        reason: beltQueuePharmacistReview.reason,
        ReviewBy: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        createdAt: beltQueuePharmacistReview.createdAt,
        updatedAt: beltQueuePharmacistReview.updatedAt,
      })
      .from(beltQueuePharmacistReview)
      .leftJoin(
        beltQueues,
        eq(beltQueuePharmacistReview.orderId, beltQueues.orderId),
      )
      .leftJoin(user, eq(beltQueuePharmacistReview.pharmacistId, user.id))
      .where(
        and(
          inArray(
            beltQueuePharmacistReview.orderId,
            queue.map((item) => item.orderId),
          ),
        ),
      );

    // Build index Map for O(1) lookups instead of O(n) filter per item (Rule 7.1)
    const reviewsByOrderId = new Map<string, typeof pharmacistReview>();
    for (const review of pharmacistReview) {
      if (!review.orderId) continue;
      const existing = reviewsByOrderId.get(review.orderId) || [];
      reviewsByOrderId.set(review.orderId, [...existing, review]);
    }

    const queueWihPharmacistReview = queue.map((item) => {
      const review = reviewsByOrderId.get(item.orderId);
      return {
        ...item,
        PharmacistReview: review && review.length > 0 ? review : null,
      };
    });

    return {
      queue: queueWihPharmacistReview,
      length: countQueue.length,
      totalPages: Math.ceil(countQueue.length / (limit ?? 10)) || 1,
    };
  } catch (error) {
    return undefined;
  }
}

export async function getQueueByBeltCodeInProcessView(
  beltCode: String,
  status: Array<(typeof beltQueueStatusTypes)[number]> | undefined = undefined,
  pharmacistReviewStatus:
    | Array<(typeof pharmacistReviewStatusTypes)[number]>
    | undefined = undefined,
  filter: {
    search?: string | undefined;
    isSkipped?: boolean | undefined;
    isLocked?: boolean | undefined;
    groupId?: number | undefined;
    shipDateFrom?: string | undefined;
    shipDateTo?: string | undefined;
    /** When set (e.g. 2), only orders with fewer than this many pharmacist reviews are returned. */
    reviewCountLessThan?: number | undefined;
    itemStatus?: ProcessViewItemStatus | undefined;
    isCv?: boolean | undefined;
  },
  getLogs: boolean | undefined = false,
  limit: number = 15,
  offset: number = 0,
) {
  try {
    // const start = performance.now();

    const shipDateFromDate =
      filter.shipDateFrom
        ? new Date(filter.shipDateFrom + "T00:00:00")
        : undefined;
    const shipDateToDate =
      filter.shipDateTo
        ? new Date(filter.shipDateTo + "T23:59:59.999")
        : undefined;

    const reviewCountLessThan = filter.reviewCountLessThan;
    const baseWhereCondition = and(
      or(eq(beltQueues.beltCode, beltCode?.charAt(0))),
      status?.length ? inArray(beltQueues.status, status) : undefined,
      filter.search
        ? or(
          like(beltQueues.orderId, `%${filter.search}%`),
          like(beltQueues.patientId, `%${filter.search}%`),
          like(beltQueues.trackingNumber, `%${filter.search}%`),
          like(beltQueues.patientName, `%${filter.search}%`),
        )
        : undefined,
      filter.isSkipped ? eq(beltQueues.skipped, filter.isSkipped) : undefined,
      filter.isLocked ? isNotNull(beltQueues.lockedForUserId) : undefined,
      filter.groupId ? eq(beltQueues.groupId, filter.groupId) : undefined,
      shipDateFromDate ? gte(beltQueues.shippedAt, shipDateFromDate) : undefined,
      shipDateToDate ? lte(beltQueues.shippedAt, shipDateToDate) : undefined,
      filter.isCv !== undefined ? eq(beltQueues.isCv, filter.isCv) : undefined,
      reviewCountLessThan != null
        ? sql`${beltQueues.orderId} NOT IN (SELECT order_id FROM belt_queues_pharmacist_review GROUP BY order_id HAVING COUNT(*) >= ${reviewCountLessThan})`
        : undefined,
    );

    let itemStatusOrderIds: string[] | undefined;
    if (
      filter.itemStatus &&
      filter.itemStatus !== PROCESS_VIEW_ITEM_STATUS_ANY
    ) {
      const candidateQueues = await db
        .select({
          orderId: beltQueues.orderId,
          metadata: beltQueues.metadata,
        })
        .from(beltQueues)
        .where(baseWhereCondition);

      const candidateOrderIds = candidateQueues.map((queue) => queue.orderId);
      const expectedItems =
        candidateOrderIds.length > 0
          ? await db
            .select({
              orderId: orderExpectedItems.orderId,
              packageId: orderExpectedItems.packageId,
              legacyId: orderExpectedItems.legacyId,
              din: orderExpectedItems.din,
              description: orderExpectedItems.description,
            })
            .from(orderExpectedItems)
            .where(inArray(orderExpectedItems.orderId, candidateOrderIds))
          : [];

      const expectedItemsByOrderId = new Map<string, typeof expectedItems>();
      for (const expectedItem of expectedItems) {
        const existing = expectedItemsByOrderId.get(expectedItem.orderId) ?? [];
        expectedItemsByOrderId.set(expectedItem.orderId, [
          ...existing,
          expectedItem,
        ]);
      }

      itemStatusOrderIds = candidateQueues
        .filter((queue) =>
          beltQueueMatchesItemStatusFilter(
            filter.itemStatus!,
            expectedItemsByOrderId.get(queue.orderId) ?? [],
            queue.metadata,
          ),
        )
        .map((queue) => queue.orderId);
    }

    const whereCondition = and(
      baseWhereCondition,
      itemStatusOrderIds
        ? itemStatusOrderIds.length > 0
          ? inArray(beltQueues.orderId, itemStatusOrderIds)
          : sql`FALSE`
        : undefined,
    );

    const [countResult, queue] = await Promise.all([
      db
        .select({ length: count() })
        .from(beltQueues)
        .where(whereCondition)
        .execute(),
      db.query.beltQueues
        .findMany({
          limit: limit,
          offset: offset,
          with: {
            BoxSize: {
              columns: {
                id: true,
                name: true,
                type: true,
                h: true,
                w: true,
                l: true,
                unit: true,
                description: true,
              },
            },
            Affiliate: {
              columns: {
                id: true,
                code: true,
                name: true,
                pwAuthPassword: false,
                pwAuthUsername: false,
                pwLocal: false,
                category: true,
                status: true,
                shippingPreference: true,
              },
            },
            LockedForBeltUser: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            SkippedBy: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            Logs:
              getLogs === true
                ? {
                  with: {
                    User: {
                      columns: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                  columns: {
                    id: true,
                    action: true,
                    description: true,
                    createdAt: true,
                  },
                }
                : undefined,
          },
          where: () => whereCondition,
          orderBy: (queue, { asc, desc }) => [desc(queue.labelCreatedAt)],
        })
        .execute(),
    ]);

    const countQueue = countResult[0];

    const pharmacistReview =
      queue.length > 0
        ? await db
          .select({
            orderId: beltQueues.orderId,
            status: beltQueuePharmacistReview.status,
            reason: beltQueuePharmacistReview.reason,
            ReviewBy: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
            createdAt: beltQueuePharmacistReview.createdAt,
            updatedAt: beltQueuePharmacistReview.updatedAt,
          })
          .from(beltQueuePharmacistReview)
          .leftJoin(
            beltQueues,
            eq(beltQueuePharmacistReview.orderId, beltQueues.orderId),
          )
          .leftJoin(user, eq(beltQueuePharmacistReview.pharmacistId, user.id))
          .where(
            inArray(
              beltQueuePharmacistReview.orderId,
              queue.map((item) => item.orderId),
            ),
          )
        : [];

    // Build index Map for O(1) lookups instead of O(n) filter per item (Rule 7.1)
    const reviewsByOrderId = new Map<string, typeof pharmacistReview>();
    for (const review of pharmacistReview) {
      if (!review.orderId) continue;
      const existing = reviewsByOrderId.get(review.orderId) || [];
      reviewsByOrderId.set(review.orderId, [...existing, review]);
    }

    const queueWihPharmacistReview = queue.map((item) => {
      const review = reviewsByOrderId.get(item.orderId);
      return {
        ...item,
        PharmacistReview: review && review.length > 0 ? review : null,
      };
    });

    const distinctGroupIds = [
      ...new Set(
        queue
          .map((item) => item.groupId)
          .filter((g): g is number => g != null && g !== -1),
      ),
    ];

    let groupIdToOrderIds: Record<number, string[]> = {};
    let extraQueueRows: (typeof queueWihPharmacistReview)[number][] = [];
    if (distinctGroupIds.length > 0) {
      const groupOrders = await db
        .select({
          groupId: beltQueues.groupId,
          orderId: beltQueues.orderId,
        })
        .from(beltQueues)
        .where(inArray(beltQueues.groupId, distinctGroupIds));
      for (const row of groupOrders) {
        const gid = row.groupId as number;
        if (gid == null) continue;
        if (!groupIdToOrderIds[gid]) groupIdToOrderIds[gid] = [];
        groupIdToOrderIds[gid].push(row.orderId);
      }

      const orderIdsOnPage = new Set(queue.map((q) => q.orderId));
      const additionalOrderIds = [
        ...new Set(
          distinctGroupIds.flatMap((gid) =>
            (groupIdToOrderIds[gid] ?? []).filter(
              (id) => !orderIdsOnPage.has(id),
            ),
          ),
        ),
      ];

      if (additionalOrderIds.length > 0) {
        const additionalRows = await db.query.beltQueues.findMany({
          where: (q, { inArray, eq }) =>
            and(
              eq(q.beltCode, beltCode?.charAt(0)),
              inArray(q.orderId, additionalOrderIds),
            ),
          with: {
            BoxSize: {
              columns: {
                id: true,
                name: true,
                type: true,
                h: true,
                w: true,
                l: true,
                unit: true,
                description: true,
              },
            },
            Affiliate: {
              columns: {
                id: true,
                code: true,
                name: true,
                pwAuthPassword: false,
                pwAuthUsername: false,
                pwLocal: false,
                category: true,
                status: true,
                shippingPreference: true,
              },
            },
            LockedForBeltUser: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            SkippedBy: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            Logs: getLogs
              ? {
                with: {
                  User: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                columns: {
                  id: true,
                  action: true,
                  description: true,
                  createdAt: true,
                },
              }
              : undefined,
          },
        });

        const extraPharmacistReview =
          additionalRows.length > 0
            ? await db
              .select({
                orderId: beltQueues.orderId,
                status: beltQueuePharmacistReview.status,
                reason: beltQueuePharmacistReview.reason,
                ReviewBy: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                },
                createdAt: beltQueuePharmacistReview.createdAt,
                updatedAt: beltQueuePharmacistReview.updatedAt,
              })
              .from(beltQueuePharmacistReview)
              .leftJoin(
                beltQueues,
                eq(beltQueuePharmacistReview.orderId, beltQueues.orderId),
              )
              .leftJoin(
                user,
                eq(beltQueuePharmacistReview.pharmacistId, user.id),
              )
              .where(
                inArray(
                  beltQueuePharmacistReview.orderId,
                  additionalRows.map((r) => r.orderId),
                ),
              )
            : [];

        type ReviewRow = (typeof extraPharmacistReview)[number];
        const extraReviewsByOrderId = new Map<string, ReviewRow[]>();
        for (const review of extraPharmacistReview) {
          if (!review.orderId) continue;
          const existing = extraReviewsByOrderId.get(review.orderId) ?? [];
          extraReviewsByOrderId.set(review.orderId, [...existing, review]);
        }

        extraQueueRows = additionalRows.map((item) => {
          const reviews = extraReviewsByOrderId.get(item.orderId);
          return {
            ...item,
            PharmacistReview: reviews && reviews.length > 0 ? reviews : null,
          };
        }) as (typeof queueWihPharmacistReview)[number][];
      }
    }

    const finalQueue = [...queueWihPharmacistReview, ...extraQueueRows];
    const finalQueueOrderIds = [...new Set(finalQueue.map((item) => item.orderId))];
    const expectedItemsForQueue =
      finalQueueOrderIds.length > 0
        ? await db
          .select({
            orderId: orderExpectedItems.orderId,
            packageId: orderExpectedItems.packageId,
            legacyId: orderExpectedItems.legacyId,
            din: orderExpectedItems.din,
            description: orderExpectedItems.description,
          })
          .from(orderExpectedItems)
          .where(inArray(orderExpectedItems.orderId, finalQueueOrderIds))
        : [];
    const expectedItemsByOrderId = new Map<
      string,
      typeof expectedItemsForQueue
    >();

    for (const item of expectedItemsForQueue) {
      const existing = expectedItemsByOrderId.get(item.orderId) ?? [];
      expectedItemsByOrderId.set(item.orderId, [...existing, item]);
    }

    const finalQueueWithOrderedStatus = finalQueue.map((item) => {
      const expectedItems = expectedItemsByOrderId.get(item.orderId) ?? [];
      const orderedItems = getOrderedItems(item.metadata);
      const specialItems = getSpecialItems(item.metadata);
      const receivedItems = getReceivedItems(item.metadata);
      const prepItemsCount = expectedItems.filter((expectedItem) => {
        const key = getOrderedItemKey(expectedItem);
        return orderedItems[key] || specialItems[key];
      }).length;
      const specialItemsCount = expectedItems.filter((expectedItem) => {
        const key = getOrderedItemKey(expectedItem);
        return specialItems[key] && !orderedItems[key];
      }).length;
      const receivedItemsCount = expectedItems.filter(
        (expectedItem) => receivedItems[getOrderedItemKey(expectedItem)],
      ).length;

      return {
        ...item,
        expectedItemsCount: expectedItems.length,
        orderedItemsCount: prepItemsCount,
        specialItemsCount,
        receivedItemsCount,
        allItemsOrdered:
          expectedItems.length > 0 && prepItemsCount === expectedItems.length,
        allItemsSpecial:
          expectedItems.length > 0 && specialItemsCount === expectedItems.length,
        allItemsReceived:
          expectedItems.length > 0 &&
          receivedItemsCount === expectedItems.length,
      };
    });

    // const end = performance.now();
    // console.log(
    //   `Time taken: \x1b[33m${((end - start) / 1000).toFixed(3)}\x1b[0m seconds`
    // );
    return {
      queue: finalQueueWithOrderedStatus,
      length: countQueue.length,
      totalPages: Math.ceil(countQueue.length / (limit ?? 10)) || 1,
      groupIdToOrderIds,
    };
  } catch (error) {
    return undefined;
  }
}

export async function getQueueByBeltCodeAndLockForBeltUser(
  beltCode: String,
  userId: string,
  status: Array<(typeof beltQueueStatusTypes)[number]> = ["SENT_TO_BELT"],
  updateStatus: (typeof beltQueueStatusTypes)[number] | undefined = undefined,
  orderIds: Array<string> | undefined = undefined,
  trackingNumbers: Array<string> | undefined = undefined,
  limit: number = 1,
  offset: number = 0,
  includeTotalCount: boolean = false,
) {
  try {
    const transaction = await db.transaction(async (tx) => {
      const countQueue = await tx.query.beltQueues
        .findMany({
          columns: {
            id: true,
            orderId: true,
            lockedForUserId: true,
            lockedAt: true,
            status: true,
          },
          where: (queue, { eq, inArray, and }) =>
            and(
              or(
                eq(queue.lockedForUserId, userId),
                isNull(queue.lockedForUserId),
              ),
              eq(queue.beltCode, beltCode?.charAt(0)),
              orderIds?.length ? inArray(queue.orderId, orderIds) : undefined,
              trackingNumbers?.length
                ? inArray(queue.trackingNumber, trackingNumbers)
                : undefined,
              inArray(queue.status, status),
              eq(queue.skipped, false),
            ),
          orderBy: (queue, { asc }) => [
            asc(queue.batchId),
            asc(queue.labelCreatedAt),
          ],
        })
        .execute();

      if (countQueue.length === 0) return undefined;
      const selectedOrderId = countQueue[0].orderId;

      // Get total count (without orderIds/trackingNumbers filter) if requested
      let totalCount = countQueue.length;
      if (includeTotalCount && (orderIds?.length || trackingNumbers?.length)) {
        const totalCountQuery = await tx.query.beltQueues
          .findMany({
            columns: { id: true },
            where: (queue, { eq, inArray, and }) =>
              and(
                or(
                  eq(queue.lockedForUserId, userId),
                  isNull(queue.lockedForUserId),
                ),
                eq(queue.beltCode, beltCode?.charAt(0)),
                inArray(queue.status, status),
                eq(queue.skipped, false),
              ),
          })
          .execute();
        totalCount = totalCountQuery.length;
      }

      const pickQueue = await tx
        .update(beltQueues)
        .set({
          lockedForUserId: userId,
          lockedAt: sql`CURRENT_TIMESTAMP`,
          status: updateStatus,
        })
        .where(
          and(
            or(
              eq(beltQueues.lockedForUserId, userId),
              isNull(beltQueues.lockedForUserId),
            ),
            inArray(beltQueues.status, status),
            eq(beltQueues.orderId, selectedOrderId),
            orderIds?.length
              ? inArray(beltQueues.orderId, orderIds)
              : undefined,
            eq(beltQueues.skipped, false),
          ),
        )
        .execute();

      if (pickQueue[0].affectedRows === 0) return undefined;

      const queue = await tx.query.beltQueues
        .findMany({
          limit: limit,
          offset: offset,
          with: {
            BoxSize: {
              columns: {
                id: true,
                name: true,
                type: true,
                h: true,
                w: true,
                l: true,
                unit: true,
                description: true,
              },
            },
            Affiliate: {
              columns: {
                id: true,
                code: true,
                name: true,
                pwAuthPassword: false,
                pwAuthUsername: false,
                pwLocal: false,
                category: true,
                status: true,
                shippingPreference: true,
              },
            },
            TempaidBox: {
              columns: {
                id: true,
                boxNumber: true,
              },
            },
          },
          where: (beltQueues, { inArray, and }) =>
            and(
              eq(beltQueues.lockedForUserId, userId),
              inArray(beltQueues.status, status),
              eq(beltQueues.orderId, selectedOrderId),
              orderIds?.length
                ? inArray(beltQueues.orderId, orderIds)
                : undefined,
              eq(beltQueues.skipped, false),
            ),
          orderBy: (queue, { asc }) => [
            asc(queue.batchId),
            asc(queue.labelCreatedAt),
          ],
        })
        .execute();

      return { queue, countQueue, totalCount };
    });

    if (!transaction) return undefined;

    return {
      queue: transaction.queue,
      length: transaction.countQueue.length,
      totalLength: transaction.totalCount,
    };
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

export async function setAllUnlockedBeltUserInQueue(userId: string) {
  try {
    const updateQueue = await db
      .update(beltQueues)
      .set({
        lockedForUserId: null,
        lockedAt: null,
      })
      .where(eq(beltQueues.lockedForUserId, userId))
      .execute();

    if (updateQueue[0].affectedRows === 0) return undefined;
    return updateQueue;
  } catch (error) {
    return undefined;
  }
}

const AllowedBeltCodes = ["C"];
export async function getQueueForPharmacist(
  userId: string,
  status: Array<(typeof beltQueueStatusTypes)[number]> = ["COMPLETED"],
  orderIds: Array<string> | undefined = undefined,
  filter: {
    fromDate?: Date | undefined;
  } | undefined = undefined,
  limit: number = 1,
  offset: number = 0,
) {
  try {
    //total queue
    const maxLimit = 50;
    const reviewCountCutoff = 4;

    const queueToReview = await db
      .select({
        orderId: beltQueues.orderId,
        beltCode: beltQueues.beltCode,
        reviewCount:
          sql<number>`COUNT(${beltQueuePharmacistReview.pharmacistId})`.as(
            "reviewCount",
          ),
        approvedByCurrentPharmacist:
          sql<boolean>`MAX(IF(${beltQueuePharmacistReview.pharmacistId} = ${userId}, 1, 0))`.as(
            "approvedByCurrentPharmacist",
          ),
        updatedAt: beltQueues.updatedAt,
      })
      .from(beltQueues)
      .leftJoin(
        beltQueuePharmacistReview,
        and(eq(beltQueuePharmacistReview.orderId, beltQueues.orderId)),
      )
      .where(
        and(
          inArray(beltQueues.beltCode, AllowedBeltCodes),
          inArray(beltQueues.status, ["STAGE2", "STAGE3", "COMPLETED"]),
          filter?.fromDate
            ? gte(
              sql`DATE(${beltQueues.updatedAt})`,
              sql`${filter.fromDate.toISOString().slice(0, 10)}`
            )
            : undefined,
        ),
      )
      .groupBy(beltQueues.orderId)
      .having(
        and(
          sql`reviewCount < ${reviewCountCutoff}`,
          eq(sql`approvedByCurrentPharmacist`, 0),
        ),
      );

    if (queueToReview.length === 0 && orderIds?.length === 0) return undefined;

    const countQueue = await db
      .select({
        id: beltQueues.id,
        orderId: beltQueues.orderId,
        beltCode: beltQueues.beltCode,
      })
      .from(beltQueues)
      .where(
        and(
          inArray(beltQueues.beltCode, AllowedBeltCodes),
          inArray(beltQueues.status, status),
          or(
            !orderIds || orderIds.length === 0 ? inArray(
              beltQueues.orderId,
              queueToReview.map((item) => item.orderId),
            ) : undefined,
            orderIds?.length
              ? inArray(beltQueues.orderId, orderIds)
              : undefined,
          ),
        ),
      )
      .execute();

    const queue = await db.query.beltQueues
      .findMany({
        limit: limit,
        offset: offset,
        with: {
          BoxSize: {
            columns: {
              id: true,
              name: true,
              type: true,
              h: true,
              w: true,
              l: true,
              unit: true,
              description: true,
            },
          },
          Affiliate: {
            columns: {
              id: true,
              code: true,
              name: true,
              pwAuthPassword: false,
              pwAuthUsername: false,
              pwLocal: false,
              category: true,
              status: true,
              shippingPreference: true,
            },
          },
        },
        where: (beltQueues, { inArray, and }) =>
          and(
            inArray(beltQueues.status, status),
            countQueue?.length && countQueue.length > 0
              ? inArray(
                beltQueues.orderId,
                countQueue.map((item) => item.orderId).slice(0, maxLimit),
              )
              : undefined,
          ),
        orderBy: (queue, { asc }) => [
          asc(queue.batchId),
          asc(queue.labelCreatedAt),
        ],
      })
      .execute();


    const getExpectedItems = await db
      .select({
        ...(orderExpectedItems as any),
        affiliateId: beltQueues.affiliateId,
        Package: {
          ...(packages as any),
          Drug: drugs,
        },
      })
      .from(orderExpectedItems)
      .leftJoin(
        beltQueues,
        eq(beltQueues.orderId, orderExpectedItems.orderId),
      )
      .leftJoin(
        packages,
        or(
          and(
            eq(beltQueues.affiliateId, -1),
            eq(
              sql`CAST(SUBSTRING(${orderExpectedItems.legacyId}, 4) AS UNSIGNED)`,
              packages.id,
            ),
          ), and(
            not(eq(beltQueues.affiliateId, -1)),
            eq(
              sql`CAST(SUBSTRING(${orderExpectedItems.packageId}, 4) AS UNSIGNED)`,
              packages.id,
            ),
          )
        )
      )
      .leftJoin(drugs, eq(packages.drugId, drugs.id))
      .where(
        and(
          queue?.length && queue.length > 0
            ? inArray(
              orderExpectedItems.orderId,
              queue.map((q) => q.orderId),
            )
            : undefined,
        ),
      );

    const queueWithItems = queue.map((item) => {
      const items = getExpectedItems.filter(
        (orderItem: any) => orderItem.orderId === item.orderId,
      );
      return {
        ...item,
        items: items,
      };
    });

    if (queue.length === 0) return undefined;
    return {
      queue: queueWithItems,
      length: countQueue.length,
    };
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

export async function getCageLengthByCageCode(cageCode: string) {
  try {
    const todaysQueueInCompleted = await db
      .select({
        cageCode: beltQueues.cageCode,
        length: sql<number>`COUNT(${beltQueues.cageCode})`,
      })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.cageCode, cageCode),
          eq(beltQueues.status, "COMPLETED"),
          isNotNull(beltQueues.shippedAt),
          gt(beltQueues.shippedAt, sql`CURRENT_DATE`),
        ),
      )
      .groupBy(beltQueues.cageCode);

    return todaysQueueInCompleted;
  } catch (error) {
    return undefined;
  }
}

export async function getAllCagesLength() {
  try {
    const todaysQueueInCompleted = await db
      .select({
        cageCode: beltQueues.cageCode,
        length: sql<number>`COUNT(${beltQueues.cageCode})`,
      })
      .from(beltQueues)
      .where(
        and(
          isNotNull(beltQueues.cageCode),
          eq(beltQueues.status, "COMPLETED"),
          isNotNull(beltQueues.shippedAt),
          gte(beltQueues.shippedAt, sql`CURRENT_DATE`),
        ),
      )
      .groupBy(beltQueues.cageCode);

    return todaysQueueInCompleted;
  } catch (error) {
    return undefined;
  }
}
