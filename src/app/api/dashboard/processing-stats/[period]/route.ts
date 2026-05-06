import { NextRequest, NextResponse } from "next/server";
import { getProcessingStatsForPeriod } from "@/server/controller/dashboard";
import { assertDashboardApiAccess } from "@/lib/auth/dashboard-api-auth";

const VALID_PERIODS = ["today", "7days", "30days"] as const;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ period: string }> },
) {
  const denied = await assertDashboardApiAccess();
  if (denied) return denied;

  try {

    const { period } = await context.params;
    if (!period || !VALID_PERIODS.includes(period as (typeof VALID_PERIODS)[number])) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }
    const data = await getProcessingStatsForPeriod(period as (typeof VALID_PERIODS)[number]);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching processing stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
