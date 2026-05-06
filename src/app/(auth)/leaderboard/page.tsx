"use server";
import {
  getLeaderboardForStage,
  getTotalCompletedOrders,
} from "@/server/controller/users";
import LeaderboardContent from "@/components/pages/leaderboard/leaderboard-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LeaderboardPage() {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (!authentication?.user) return redirect("/sign-in");

  const [stage1Data, stage2Data, stage3Data, totalCompleted] =
    await Promise.all([
      getLeaderboardForStage("1"),
      getLeaderboardForStage("2"),
      getLeaderboardForStage("3"),
      getTotalCompletedOrders("today"),
    ]);

  return (
    <LeaderboardContent
      stage1Data={stage1Data}
      stage2Data={stage2Data}
      stage3Data={stage3Data}
      totalCompletedToday={totalCompleted}
      currentUserId={authentication.user.id}
    />
  );
}
