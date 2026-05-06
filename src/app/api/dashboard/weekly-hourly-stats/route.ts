import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { beltQueues } from "@/db/schema";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { assertDashboardApiAccess } from "@/lib/auth/dashboard-api-auth";

const DASHBOARD_BELT_CODE = "C";

export async function GET() {
  const denied = await assertDashboardApiAccess();
  if (denied) return denied;

  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const hourlyStats = await db
      .select({
        date: sql<string>`DATE(shipped_at)`,
        hour: sql<number>`HOUR(shipped_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.shippedAt, sevenDaysAgo),
          lte(beltQueues.shippedAt, today),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.status, "COMPLETED"),
        ),
      )
      .groupBy(sql`DATE(shipped_at), HOUR(shipped_at)`)
      .orderBy(sql`DATE(shipped_at), HOUR(shipped_at)`);

    // Convert to the format expected by the chart - only include non-zero hours
    const result = hourlyStats
      .filter(stat => stat.count > 0)
      .map(stat => ({
        datetime: `${stat.date} ${stat.hour.toString().padStart(2, '0')}:00`,
        today: 0,
        sevenDays: stat.count,
      }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching weekly hourly stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly hourly stats" },
      { status: 500 }
    );
  }
}