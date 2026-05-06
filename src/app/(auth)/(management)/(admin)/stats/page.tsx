"use server";
import {
  getLeaderboardForStage,
  getTotalCompletedOrders,
  getTotalSkippedOrders,
  getTotalQueuedOrders,
  getPharmacistLeaderboard,
  getSkipLeaderboard,
} from "@/server/controller/users";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import StatsContent from "@/components/pages/management/stats/stats-content";

export default async function StatsPage() {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (!authentication?.user) return redirect("/sign-in");

  const [stage1Data, stage2Data, stage3Data, totalCompleted, pharmacistData, skipData, totalSkipped, totalQueued] =
    await Promise.all([
      getLeaderboardForStage("1", "today"),
      getLeaderboardForStage("2", "today"),
      getLeaderboardForStage("3", "today"),
      getTotalCompletedOrders("today"),
      getPharmacistLeaderboard("today"),
      getSkipLeaderboard("today"),
      getTotalSkippedOrders("today"),
      getTotalQueuedOrders("today"),
    ]);

  return (
    <StatsContent
      stage1Data={stage1Data}
      stage2Data={stage2Data}
      stage3Data={stage3Data}
      totalCompletedToday={totalCompleted}
      pharmacistData={pharmacistData}
      skipData={skipData}
      totalSkipped={totalSkipped}
      totalQueued={totalQueued}
      currentUserId={authentication.user.id}
    />
  );
}
