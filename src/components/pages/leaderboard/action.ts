"use server";

import { getLeaderboardForStage, getTotalCompletedOrders } from "@/server/controller/users";

export async function refreshLeaderboardData() {
  try {
    const [stage1Data, stage2Data, stage3Data, totalCompleted] = await Promise.all([
      getLeaderboardForStage("1"),
      getLeaderboardForStage("2"),
      getLeaderboardForStage("3"),
      getTotalCompletedOrders("today"),
    ]);

    return {
      success: true,
      data: {
        stage1Data,
        stage2Data,
        stage3Data,
        totalCompletedToday: totalCompleted,
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
