"use server";

import { cache } from "react";
import { db } from "@/db/db";
import { beltQueues, logs, user, users } from "@/db/schema";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";

const STATS_BELT_CODE = "C";

export const getAllUsers = cache(async function getAllUsers() {
  try {
    const allusers = await db.query.user.findMany({
      orderBy: (user, { desc }) => desc(user.createdAt),
    });
    return allusers;
  } catch (error) {
    console.log(error);
    return undefined;
  }
});

// Per-request deduplication with React.cache() (Rule 3.4)
export const getUserById = cache(async function getUserById(id: string) {
  try {
    const userData = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    });
    return userData;
  } catch (error) {
    console.log(error);
    return undefined;
  }
});

export async function getUserPushOrdersCountToday(
  userId: string,
  beltStage: "1" | "2" | "3"
) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT order_id)`,
      })
      .from(logs)
      .where(
        and(
          eq(logs.userId, userId),
          eq(
            logs.action,
            beltStage === "1"
              ? "PUSH_QUEUE_STAGE2"
              : beltStage === "2"
                ? "PUSH_QUEUE_STAGE3"
                : "PUSH_QUEUE_COMPLETED"
          ),
          gte(logs.createdAt, today)
        )
      );

    return result?.count || 0;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

export type StatsPeriod = "today" | "7days" | "30days" | "custom";

export type StatsDateRange = {
  from: string;
  to: string;
};

function getStartDateForPeriod(period: StatsPeriod): Date {
  const date = new Date();
  switch (period) {
    case "today":
      date.setHours(0, 0, 0, 0);
      break;
    case "7days":
      date.setDate(date.getDate() - 7);
      date.setHours(0, 0, 0, 0);
      break;
    case "30days":
      date.setDate(date.getDate() - 30);
      date.setHours(0, 0, 0, 0);
      break;
  }
  return date;
}

function buildDateConditions(
  period: StatsPeriod,
  dateRange?: StatsDateRange
) {
  if (period === "custom" && dateRange) {
    const from = new Date(dateRange.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    return and(gte(logs.createdAt, from), lte(logs.createdAt, to));
  }
  return gte(logs.createdAt, getStartDateForPeriod(period));
}

export async function getTotalQueuedOrders(
  period: StatsPeriod = "today",
  dateRange?: StatsDateRange
) {
  try {
    let dateFilter;
    if (period === "custom" && dateRange) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      dateFilter = and(gte(beltQueues.createdAt, from), lte(beltQueues.createdAt, to));
    } else {
      dateFilter = gte(beltQueues.createdAt, getStartDateForPeriod(period));
    }

    const [result] = await db
      .select({ count: count() })
      .from(beltQueues)
      .where(and(eq(beltQueues.beltCode, STATS_BELT_CODE), dateFilter));

    return result?.count || 0;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

export async function getLeaderboardForStage(
  beltStage: "1" | "2" | "3",
  period: StatsPeriod = "today",
  dateRange?: StatsDateRange
) {
  try {
    const action =
      beltStage === "1"
        ? "PUSH_QUEUE_STAGE2"
        : beltStage === "2"
          ? "PUSH_QUEUE_STAGE3"
          : "PUSH_QUEUE_COMPLETED";

    const dateCondition = buildDateConditions(period, dateRange);

    const results = await db
      .select({
        userId: logs.userId,
        userName: user.name,
        userEmail: user.email,
        beltCode: user.beltCode,
        count: sql<number>`COUNT(DISTINCT ${logs.orderId})`,
      })
      .from(logs)
      .leftJoin(user, eq(logs.userId, user.id))
      .where(
        and(
          eq(logs.beltCode, STATS_BELT_CODE),
          eq(logs.action, action),
          dateCondition,
        ),
      )
      .groupBy(logs.userId, user.name, user.email, user.beltCode)
      .orderBy(sql`COUNT(DISTINCT ${logs.orderId}) DESC`);

    return results.map((result, index) => ({
      rank: index + 1,
      userId: result.userId,
      userName: result.userName || "Unknown User",
      userEmail: result.userEmail,
      beltCode: result.beltCode,
      count: result.count,
    }));
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getTotalCompletedOrders(
  period: StatsPeriod = "today",
  dateRange?: StatsDateRange
) {
  try {
    let dateFilter;
    if (period === "custom" && dateRange) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      dateFilter = and(gte(beltQueues.shippedAt, from), lte(beltQueues.shippedAt, to));
    } else {
      dateFilter = gte(beltQueues.shippedAt, getStartDateForPeriod(period));
    }

    const [result] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${beltQueues.orderId})`,
      })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, STATS_BELT_CODE),
          eq(beltQueues.status, "COMPLETED"),
          dateFilter,
        ),
      );

    return result?.count || 0;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

export async function getTotalSkippedOrders(
  period: StatsPeriod = "today",
  dateRange?: StatsDateRange
) {
  try {
    const dateCondition = buildDateConditions(period, dateRange);

    const [result] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${logs.orderId})`,
      })
      .from(logs)
      .where(
        and(
          eq(logs.beltCode, STATS_BELT_CODE),
          eq(logs.action, "PUSH_QUEUE_SKIP"),
          dateCondition
        )
      );

    return result?.count || 0;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

export async function getSkipLeaderboard(
  period: StatsPeriod = "today",
  dateRange?: StatsDateRange
) {
  try {
    const dateCondition = buildDateConditions(period, dateRange);
    const skipActions = sql`${logs.action} IN ('PUSH_QUEUE_SKIP', 'PUSH_QUEUE_SKIP_OPEN')`;

    const results = await db
      .select({
        userId: logs.userId,
        userName: user.name,
        userEmail: user.email,
        beltCode: user.beltCode,
        skipped: sql<number>`COUNT(DISTINCT CASE WHEN ${logs.action} = 'PUSH_QUEUE_SKIP' THEN ${logs.orderId} END)`,
        unskipped: sql<number>`COUNT(DISTINCT CASE WHEN ${logs.action} = 'PUSH_QUEUE_SKIP_OPEN' THEN ${logs.orderId} END)`,
        total: sql<number>`COUNT(DISTINCT CASE WHEN ${logs.action} = 'PUSH_QUEUE_SKIP' THEN ${logs.orderId} END) + COUNT(DISTINCT CASE WHEN ${logs.action} = 'PUSH_QUEUE_SKIP_OPEN' THEN ${logs.orderId} END)`,
      })
      .from(logs)
      .leftJoin(user, eq(logs.userId, user.id))
      .where(and(eq(logs.beltCode, STATS_BELT_CODE), skipActions, dateCondition))
      .groupBy(logs.userId, user.name, user.email, user.beltCode)
      .orderBy(sql`COUNT(DISTINCT CASE WHEN ${logs.action} = 'PUSH_QUEUE_SKIP' THEN ${logs.orderId} END) + COUNT(DISTINCT CASE WHEN ${logs.action} = 'PUSH_QUEUE_SKIP_OPEN' THEN ${logs.orderId} END) DESC`);

    return results.map((result, index) => ({
      rank: index + 1,
      userId: result.userId,
      userName: result.userName || "Unknown User",
      userEmail: result.userEmail,
      beltCode: result.beltCode,
      skipped: result.skipped,
      unskipped: result.unskipped,
      total: result.total,
    }));
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getPharmacistLeaderboard(
  period: StatsPeriod = "today",
  dateRange?: StatsDateRange
) {
  try {
    let dateFilter;
    if (period === "custom" && dateRange) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      dateFilter = and(gte(logs.createdAt, from), lte(logs.createdAt, to));
    } else {
      dateFilter = gte(logs.createdAt, getStartDateForPeriod(period));
    }

    const reviewActions = sql`${logs.action} IN ('PUSH_QUEUE_REVIEW_APPROVED', 'PUSH_QUEUE_REVIEW_DENIED')`;

    const results = await db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        approved: sql<number>`COUNT(DISTINCT CASE WHEN ${logs.action} = 'PUSH_QUEUE_REVIEW_APPROVED' THEN ${logs.orderId} END)`,
        denied: sql<number>`COUNT(DISTINCT CASE WHEN ${logs.action} = 'PUSH_QUEUE_REVIEW_DENIED' THEN ${logs.orderId} END)`,
        total: sql<number>`COUNT(DISTINCT CASE WHEN ${reviewActions} THEN ${logs.orderId} END)`,
      })
      .from(user)
      .leftJoin(
        logs,
        and(
          eq(logs.userId, user.id),
          eq(logs.beltCode, STATS_BELT_CODE),
          reviewActions,
          dateFilter,
        )
      )
      .where(eq(user.role, "pharmacist"))
      .groupBy(user.id, user.name, user.email)
      .orderBy(sql`COUNT(DISTINCT CASE WHEN ${reviewActions} THEN ${logs.orderId} END) DESC`);

    return results.map((result, index) => ({
      userId: result.userId,
      userName: result.userName || "Unknown User",
      userEmail: result.userEmail,
      approved: result.approved,
      denied: result.denied,
      total: result.total,
    }))
      .filter((result) => Number(result.total) > 0)
      .map((result, index) => ({
        rank: index + 1,
        ...result,
      }));
  } catch (error) {
    console.log(error);
    return [];
  }
}