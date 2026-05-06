import { db } from "@/db/db";
import {
  beltQueues,
  beltQueuePharmacistReview,
  users,
  affiliates,
  logs,
} from "@/db/schema";
import {
  eq,
  and,
  count,
  desc,
  gte,
  lte,
  sql,
  isNotNull,
  or,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

const DASHBOARD_BELT_CODE = "C";

export async function getDashboardStats() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag("dashboard-stats");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const previousWeekStart = new Date();
  previousWeekStart.setDate(previousWeekStart.getDate() - 14);
  previousWeekStart.setHours(0, 0, 0, 0);

  const previousWeekEnd = new Date();
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);
  previousWeekEnd.setHours(0, 0, 0, 0);

  const previousMonthStart = new Date();
  previousMonthStart.setDate(previousMonthStart.getDate() - 60);
  previousMonthStart.setHours(0, 0, 0, 0);

  const previousMonthEnd = new Date();
  previousMonthEnd.setDate(previousMonthEnd.getDate() - 30);
  previousMonthEnd.setHours(0, 0, 0, 0);

  // Get more meaningful statistics - using rolling periods
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // All independent queries in one round-trip batch (no DB schema changes)
  const [
    beltTotallCounts,
    [pharmacistApprovedCount],
    [pharmacistDeniedCount],
    [todayCompleted],
    todaySkipped,
    skippedTotal,
    weeklyTotal,
    monthlyTotal,
    [yesterdayCompleted],
    previousWeekTotal,
    previousMonthTotal,
    [previousYearApproved],
    cageDistribution,
    activeUsersByRole,
    beltPerformance,
    affiliateStats,
    recentLogs,
    avgProcessingTime,
  ] = await Promise.all([
    db
      .select({ status: beltQueues.status, count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          or(
            eq(beltQueues.status, "SENT_TO_BELT"),
            eq(beltQueues.status, "STAGE1"),
            eq(beltQueues.status, "STAGE2"),
            eq(beltQueues.status, "STAGE3"),
            eq(beltQueues.status, "COMPLETED"),
            eq(beltQueues.status, "FAILED"),
          ),
        ),
      )
      .groupBy(beltQueues.status),
    db
      .select({
        count: sql<number>`COUNT(DISTINCT ${beltQueuePharmacistReview.orderId})`,
      })
      .from(beltQueuePharmacistReview)
      .innerJoin(
        beltQueues,
        eq(beltQueuePharmacistReview.orderId, beltQueues.orderId),
      )
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueuePharmacistReview.status, "APPROVED"),
          sql`DATE(${beltQueuePharmacistReview.createdAt}) = ${today.toISOString().split("T")[0]}`,
        ),
      ),
    db
      .select({
        count: sql<number>`COUNT(DISTINCT ${beltQueuePharmacistReview.orderId})`,
      })
      .from(beltQueuePharmacistReview)
      .innerJoin(
        beltQueues,
        eq(beltQueuePharmacistReview.orderId, beltQueues.orderId),
      )
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueuePharmacistReview.status, "DENIED"),
          sql`DATE(${beltQueuePharmacistReview.createdAt}) = ${today.toISOString().split("T")[0]}`,
        ),
      ),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.status, "COMPLETED"),
          sql`DATE(${beltQueues.shippedAt}) = ${today.toISOString().split("T")[0]}`
        ),
      ),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.skipped, true),
          gte(beltQueues.createdAt, today),
        ),
      ),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.skipped, true),
        ),
      ),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          gte(beltQueues.shippedAt, sevenDaysAgo),
          eq(beltQueues.status, "COMPLETED"),
        ),
      ),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          gte(beltQueues.shippedAt, thirtyDaysAgo),
          eq(beltQueues.status, "COMPLETED"),
        ),
      ),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.status, "COMPLETED"),
          sql`DATE(${beltQueues.shippedAt}) = ${yesterday.toISOString().split("T")[0]}`
        ),
      ),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          gte(beltQueues.shippedAt, previousWeekStart),
          lte(beltQueues.shippedAt, previousWeekEnd),
          eq(beltQueues.status, "COMPLETED"),
        ),
      ),
    db
      .select({ count: count() })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          gte(beltQueues.shippedAt, previousMonthStart),
          lte(beltQueues.shippedAt, previousMonthEnd),
          eq(beltQueues.status, "COMPLETED"),
        ),
      ),
    db
      .select({
        count: sql<number>`COUNT(DISTINCT ${beltQueuePharmacistReview.orderId})`,
      })
      .from(beltQueuePharmacistReview)
      .innerJoin(
        beltQueues,
        eq(beltQueuePharmacistReview.orderId, beltQueues.orderId),
      )
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueuePharmacistReview.status, "APPROVED"),
          sql`DATE(${beltQueuePharmacistReview.createdAt}) = ${yesterday.toISOString().split("T")[0]}`,
        ),
      ),
    db
      .select({
        cageCode: beltQueues.cageCode,
        length: sql<number>`COUNT(${beltQueues.cageCode})`,
      })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          isNotNull(beltQueues.cageCode),
          eq(beltQueues.status, "COMPLETED"),
          isNotNull(beltQueues.shippedAt),
          gte(beltQueues.shippedAt, sql`CURRENT_DATE`),
        ),
      )
      .groupBy(beltQueues.cageCode),
    db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .where(
        and(
          eq(users.status, "ACTIVE"),
          eq(users.beltCode, DASHBOARD_BELT_CODE),
        ),
      )
      .groupBy(users.role),
    db
      .select({
        beltCode: beltQueues.beltCode,
        count: count(beltQueues.id),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.shippedAt, today),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          isNotNull(beltQueues.beltCode),
          or(
            eq(beltQueues.status, "COMPLETED"),
            eq(beltQueues.status, "STAGE1"),
            eq(beltQueues.status, "STAGE2"),
            eq(beltQueues.status, "STAGE3"),
            eq(beltQueues.status, "FAILED"),
          ),
        ),
      )
      .groupBy(beltQueues.beltCode)
      .orderBy(desc(count(beltQueues.id))),
    db
      .select({
        affiliateId: beltQueues.affiliateId,
        affiliateName: affiliates.name,
        orderCount: count(),
      })
      .from(beltQueues)
      .leftJoin(affiliates, eq(beltQueues.affiliateId, affiliates.id))
      .where(
        and(
          gte(beltQueues.shippedAt, today),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
        ),
      )
      .groupBy(beltQueues.affiliateId)
      .orderBy(desc(count())),
    db
      .select({
        id: logs.id,
        action: logs.action,
        details: logs.description,
        userId: logs.userId,
        userName: users.name,
        createdAt: logs.createdAt,
      })
      .from(logs)
      .leftJoin(users, eq(logs.userId, users.id))
      .where(eq(logs.beltCode, DASHBOARD_BELT_CODE))
      .orderBy(desc(logs.createdAt))
      .limit(10),
    db
      .select({
        avgMinutes: sql<number>`AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at))`,
      })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.status, "COMPLETED"),
          gte(beltQueues.shippedAt, today),
        ),
      ),
  ]);

  // Calculate trends
  const calculateTrend = (
    current: number,
    previous: number
  ): { value: number; isPositive: boolean } => {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
    }
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(percentChange * 10) / 10), // Round to 1 decimal
      isPositive: percentChange >= 0,
    };
  };

  const todayCount = (todayCompleted as any)?.count || 0;
  const yesterdayCount = (yesterdayCompleted as any)?.count || 0;
  const weeklyCount = weeklyTotal[0]?.count || 0;
  const previousWeekCount = previousWeekTotal[0]?.count || 0;
  const monthlyCount = monthlyTotal[0]?.count || 0;
  const previousMonthCount = previousMonthTotal[0]?.count || 0;
  const approvedCount = (pharmacistApprovedCount as any)[0]?.count || 0;
  const previousApprovedCount = (previousYearApproved as any)[0]?.count || 0;

  return {
    stageStats: {
      sentToBelt: beltTotallCounts.find((b) => b.status === "SENT_TO_BELT")?.count || 0,
      stage1: beltTotallCounts.find((b) => b.status === "STAGE1")?.count || 0,
      stage2: beltTotallCounts.find((b) => b.status === "STAGE2")?.count || 0,
      stage3: beltTotallCounts.find((b) => b.status === "STAGE3")?.count || 0,
      completed: beltTotallCounts.find((b) => b.status === "COMPLETED")?.count || 0,
      failed: beltTotallCounts.find((b) => b.status === "FAILED")?.count || 0,
      approved: approvedCount,
      denied: (pharmacistDeniedCount as any)[0]?.count || 0,
    },
    todayStats: {
      completed: todayCount,
      skipped: todaySkipped[0]?.count || 0,
      weeklyTotal: weeklyCount,
      monthlyTotal: monthlyCount,
    },
    trends: {
      todayTrend: calculateTrend(todayCount, yesterdayCount),
      weeklyTrend: calculateTrend(weeklyCount, previousWeekCount),
      monthlyTrend: calculateTrend(monthlyCount, previousMonthCount),
      approvedTrend: calculateTrend(approvedCount, previousApprovedCount),
    },
    cageDistribution: cageDistribution?.map((c) => ({
      cage: parseInt(c.cageCode || "0") || 0,
      count: c.length || 0,
    })),
    activeUsers: activeUsersByRole,
    beltPerformance: beltPerformance.map((b) => ({
      beltCode: b.beltCode || "",
      count: b.count || 0,
    })),
    topAffiliates: affiliateStats,
    recentActivity: recentLogs,
    avgProcessingTime: avgProcessingTime[0]?.avgMinutes || 0,
  };
}

// Get hourly processing stats for chart
export async function getHourlyProcessingStats() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag("dashboard-hourly");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hourlyStats = await db
    .select({
      hour: sql<number>`HOUR(shipped_at)`,
      count: count(),
    })
    .from(beltQueues)
    .where(
      and(
        gte(beltQueues.shippedAt, today),
        eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
        or(
          eq(beltQueues.status, "COMPLETED"),
          eq(beltQueues.status, "STAGE1"),
          eq(beltQueues.status, "STAGE2"),
          eq(beltQueues.status, "STAGE3")
        )
      )
    )
    .groupBy(sql`HOUR(shipped_at)`)
    .orderBy(sql`HOUR(shipped_at)`);

  // Fill in missing hours with 0
  const fullHourlyStats = Array.from({ length: 24 }, (_, i) => {
    const stat = hourlyStats.find((s) => s.hour === i);
    return {
      hour: i,
      count: stat?.count || 0,
    };
  });

  return fullHourlyStats;
}

// Get processing stats for different periods
export async function getProcessingStatsForPeriod(
  period: "today" | "7days" | "30days"
) {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "7days":
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "30days":
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  if (period === "today") {
    // For today, return actual counts
    const hourlyStats = await db
      .select({
        hour: sql<number>`HOUR(shipped_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.shippedAt, startDate),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          or(
            eq(beltQueues.status, "COMPLETED"),
            eq(beltQueues.status, "STAGE1"),
            eq(beltQueues.status, "STAGE2"),
            eq(beltQueues.status, "STAGE3")
          )
        )
      )
      .groupBy(sql`HOUR(shipped_at)`)
      .orderBy(sql`HOUR(shipped_at)`);

    const fullHourlyStats = Array.from({ length: 24 }, (_, i) => {
      const stat = hourlyStats.find((s) => s.hour === i);
      return {
        hour: i,
        count: stat?.count || 0,
      };
    });

    return fullHourlyStats;
  } else {
    // For 7 days and 30 days, return averages
    const hourlyStats = await db
      .select({
        date: sql<string>`DATE(shipped_at)`,
        hour: sql<number>`HOUR(shipped_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.shippedAt, startDate),
          lte(beltQueues.shippedAt, endDate),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          or(
            eq(beltQueues.status, "COMPLETED"),
            eq(beltQueues.status, "STAGE1"),
            eq(beltQueues.status, "STAGE2"),
            eq(beltQueues.status, "STAGE3")
          )
        )
      )
      .groupBy(sql`DATE(shipped_at), HOUR(shipped_at)`);

    // Get unique dates
    const uniqueDates = new Set(hourlyStats.map((s) => s.date));
    const totalDays = uniqueDates.size || 1;

    // Calculate averages for each hour
    const fullHourlyStats = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyStats.filter((s) => s.hour === i);
      const totalCount = hourData.reduce((sum, s) => sum + s.count, 0);
      return {
        hour: i,
        count: Math.round(totalCount / totalDays),
      };
    });

    return fullHourlyStats;
  }
}

// Get average hourly distribution for different stages
export async function getAverageHourlyDistribution() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 600 });
  cacheTag("dashboard-distribution");

  // Get data for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get hourly counts for each stage
  const [sentToBeltData, stage3Data, completedData] = await Promise.all([
    // Orders sent to belt
    db
      .select({
        date: sql<string>`DATE(created_at)`,
        hour: sql<number>`HOUR(created_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.createdAt, thirtyDaysAgo),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          sql`HOUR(created_at) >= 5 AND HOUR(created_at) <= 16` // 5 AM to 4 PM
        )
      )
      .groupBy(sql`DATE(created_at), HOUR(created_at)`),

    // Orders reaching Stage 3
    db
      .select({
        date: sql<string>`DATE(updated_at)`,
        hour: sql<number>`HOUR(updated_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.updatedAt, thirtyDaysAgo),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.status, "STAGE3"),
          sql`HOUR(updated_at) >= 5 AND HOUR(updated_at) <= 16`
        )
      )
      .groupBy(sql`DATE(updated_at), HOUR(updated_at)`),

    // Orders completed (sent to cage)
    db
      .select({
        date: sql<string>`DATE(updated_at)`,
        hour: sql<number>`HOUR(updated_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.updatedAt, thirtyDaysAgo),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.status, "COMPLETED"),
          sql`HOUR(updated_at) >= 5 AND HOUR(updated_at) <= 16`
        )
      )
      .groupBy(sql`DATE(updated_at), HOUR(updated_at)`),
  ]);

  // Get unique dates that had any orders
  const allDates = new Set([
    ...sentToBeltData.map((d) => d.date),
    ...stage3Data.map((d) => d.date),
    ...completedData.map((d) => d.date),
  ]);
  const totalDays = allDates.size || 1; // Avoid division by zero

  // Calculate averages for each hour (5 AM to 4 PM)
  const businessHours = Array.from({ length: 12 }, (_, i) => i + 5);

  const hourlyAverages = businessHours.map((hour) => {
    const sentToBelt = sentToBeltData.filter((d) => d.hour === hour);
    const stage3 = stage3Data.filter((d) => d.hour === hour);
    const completed = completedData.filter((d) => d.hour === hour);

    return {
      hour,
      hourLabel: `${hour.toString().padStart(2, "0")}:00`,
      sentToBelt: Math.round(
        sentToBelt.reduce((sum, d) => sum + d.count, 0) / totalDays
      ),
      stage3: Math.round(
        stage3.reduce((sum, d) => sum + d.count, 0) / totalDays
      ),
      completed: Math.round(
        completed.reduce((sum, d) => sum + d.count, 0) / totalDays
      ),
    };
  });

  return {
    data: hourlyAverages,
    totalDays,
    periodStart: thirtyDaysAgo,
    periodEnd: new Date(),
  };
}

// Get hourly distribution for specific periods
export async function getHourlyDistributionForPeriod(
  period: "today" | "7days" | "30days"
) {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "7days":
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "30days":
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  // Get hourly counts for each stage
  const [sentToBeltData, stage3Data, completedData] = await Promise.all([
    // Orders sent to belt
    db
      .select({
        date: sql<string>`DATE(created_at)`,
        hour: sql<number>`HOUR(created_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.createdAt, startDate),
          lte(beltQueues.createdAt, endDate),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          sql`HOUR(created_at) >= 5 AND HOUR(created_at) <= 16`
        )
      )
      .groupBy(sql`DATE(created_at), HOUR(created_at)`),

    // Orders reaching Stage 3
    db
      .select({
        date: sql<string>`DATE(updated_at)`,
        hour: sql<number>`HOUR(updated_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.updatedAt, startDate),
          lte(beltQueues.updatedAt, endDate),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.status, "STAGE3"),
          sql`HOUR(updated_at) >= 5 AND HOUR(updated_at) <= 16`
        )
      )
      .groupBy(sql`DATE(updated_at), HOUR(updated_at)`),

    // Orders completed
    db
      .select({
        date: sql<string>`DATE(updated_at)`,
        hour: sql<number>`HOUR(updated_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.updatedAt, startDate),
          lte(beltQueues.updatedAt, endDate),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.status, "COMPLETED"),
          sql`HOUR(updated_at) >= 5 AND HOUR(updated_at) <= 16`
        )
      )
      .groupBy(sql`DATE(updated_at), HOUR(updated_at)`),
  ]);

  // For today, we don't average - just show actual counts
  if (period === "today") {
    const businessHours = Array.from({ length: 12 }, (_, i) => i + 5);
    const hourlyData = businessHours.map((hour) => {
      const sentToBelt = sentToBeltData.find((d) => d.hour === hour);
      const stage3 = stage3Data.find((d) => d.hour === hour);
      const completed = completedData.find((d) => d.hour === hour);

      return {
        hour,
        hourLabel: `${hour.toString().padStart(2, "0")}:00`,
        sentToBelt: sentToBelt?.count || 0,
        stage3: stage3?.count || 0,
        completed: completed?.count || 0,
      };
    });

    return {
      data: hourlyData,
      totalDays: 1,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  // For 7 days and 30 days, calculate averages
  const allDates = new Set([
    ...sentToBeltData.map((d) => d.date),
    ...stage3Data.map((d) => d.date),
    ...completedData.map((d) => d.date),
  ]);
  const totalDays = allDates.size || 1;

  const businessHours = Array.from({ length: 12 }, (_, i) => i + 5);
  const hourlyAverages = businessHours.map((hour) => {
    const sentToBelt = sentToBeltData.filter((d) => d.hour === hour);
    const stage3 = stage3Data.filter((d) => d.hour === hour);
    const completed = completedData.filter((d) => d.hour === hour);

    return {
      hour,
      hourLabel: `${hour.toString().padStart(2, "0")}:00`,
      sentToBelt: Math.round(
        sentToBelt.reduce((sum, d) => sum + d.count, 0) / totalDays
      ),
      stage3: Math.round(
        stage3.reduce((sum, d) => sum + d.count, 0) / totalDays
      ),
      completed: Math.round(
        completed.reduce((sum, d) => sum + d.count, 0) / totalDays
      ),
    };
  });

  return {
    data: hourlyAverages,
    totalDays,
    periodStart: startDate,
    periodEnd: endDate,
  };
}
