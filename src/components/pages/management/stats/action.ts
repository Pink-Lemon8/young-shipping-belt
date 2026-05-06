"use server";

import {
  getLeaderboardForStage,
  getTotalCompletedOrders,
  getTotalSkippedOrders,
  getTotalQueuedOrders,
  getPharmacistLeaderboard,
  getSkipLeaderboard,
  type StatsPeriod,
  type StatsDateRange,
} from "@/server/controller/users";

export async function refreshLeaderboardData(
  period: StatsPeriod = "today",
  dateRange?: StatsDateRange
) {
  try {
    const [stage1Data, stage2Data, stage3Data, totalCompleted, pharmacistData, skipData, totalSkipped, totalQueued] =
      await Promise.all([
        getLeaderboardForStage("1", period, dateRange),
        getLeaderboardForStage("2", period, dateRange),
        getLeaderboardForStage("3", period, dateRange),
        getTotalCompletedOrders(period, dateRange),
        getPharmacistLeaderboard(period, dateRange),
        getSkipLeaderboard(period, dateRange),
        getTotalSkippedOrders(period, dateRange),
        getTotalQueuedOrders(period, dateRange),
      ]);

    return {
      success: true,
      data: {
        stage1Data,
        stage2Data,
        stage3Data,
        totalCompleted,
        pharmacistData,
        skipData,
        totalSkipped,
        totalQueued,
      },
    };
  } catch (error) {
    console.error("Error refreshing leaderboard data:", error);
    return {
      success: false,
      message: "Failed to refresh leaderboard data",
    };
  }
}
