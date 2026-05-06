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
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get daily counts for the last 7 days
    const dailyStats = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        count: count(),
      })
      .from(beltQueues)
      .where(
        and(
          gte(beltQueues.shippedAt, sevenDaysAgo),
          lte(beltQueues.shippedAt, today),
          eq(beltQueues.beltCode, DASHBOARD_BELT_CODE),
          eq(beltQueues.status, "COMPLETED")
        )
      )
      .groupBy(sql`DATE(shipped_at)`)
      .orderBy(sql`DATE(shipped_at)`);

    // Fill in missing days with 0
    const dateMap = new Map(
      dailyStats.map(stat => [stat.date, stat.count])
    );

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      result.push({
        date: dateStr,
        value: dateMap.get(dateStr) || 0,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly stats" },
      { status: 500 }
    );
  }
}