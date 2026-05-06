import { Suspense } from "react";
import { auth } from "@/lib/auth";
import {
  getDashboardStats,
  getHourlyProcessingStats,
  getAverageHourlyDistribution,
} from "@/server/controller/dashboard";
import { DashboardContent } from "@/components/pages/dashboard/dashboard-content";
import { headers } from "next/headers";
import Loading from "./loading";

async function DashboardDataWrapper() {
  const hdrs = await headers();

  const [authentication, dashboardStats, hourlyStats, hourlyDistribution] =
    await Promise.all([
      auth.api.getSession({ headers: hdrs }),
      getDashboardStats(),
      getHourlyProcessingStats(),
      getAverageHourlyDistribution(),
    ]);

  return (
    <DashboardContent
      dashboardStats={dashboardStats}
      hourlyStats={hourlyStats}
      hourlyDistribution={hourlyDistribution}
      userName={authentication?.user?.name || "Not Found"}
    />
  );
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <DashboardDataWrapper />
      </Suspense>
    </>
  );
}
