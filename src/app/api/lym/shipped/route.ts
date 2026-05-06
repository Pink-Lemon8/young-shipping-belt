import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/db";
import { beltQueues } from "@/db/schema";
import "dotenv/config";
const LYMLIGHT_AFFILIATE_ID = -1;
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }, "Date must be a valid calendar date");

const dateRangeSchema = z
  .object({
    startDate: dateStringSchema,
    endDate: dateStringSchema,
  })
  .refine(({ startDate, endDate }) => endDate >= startDate, {
    message: "End date must be greater than or equal to start date",
    path: ["endDate"],
  });


export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const auth =
    req.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim() ?? (searchParams.get("AUTH") ?? "").trim();

  if (!auth) {
    return NextResponse.json(
      { status: "error", message: "Authentication token is required" },
      { status: 400 },
    );
  }

  const expectedAuth = process.env.LYMLIGHT_API_AUTH;
  if (!expectedAuth) {
    return NextResponse.json(
      { status: "error", message: "Authentication token is not configured" },
      { status: 500 },
    );
  }

  try {
    const authBuf = Buffer.from(auth, "utf8");
    const expectedBuf = Buffer.from(expectedAuth, "utf8");

    if (
      authBuf.length !== expectedBuf.length ||
      !timingSafeEqual(authBuf, expectedBuf)
    ) {
      return NextResponse.json(
        { status: "error", message: "Invalid authentication token" },
        { status: 401 },
      );
    }
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid authentication token" },
      { status: 401 },
    );
  }

  const lymlightAuthToken = process.env.LYMLIGHT_AUTH_TOKEN;
  if (!lymlightAuthToken) {
    return NextResponse.json(
      { status: "error", message: "Lymlight auth token is not configured" },
      { status: 500 },
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const parsedDateRange = dateRangeSchema.safeParse({
    startDate: (searchParams.get("startDate") ?? today).trim(),
    endDate:
      (searchParams.get("endDate") ?? searchParams.get("startDate") ?? today).trim(),
  });

  if (!parsedDateRange.success) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid date input",
        issues: parsedDateRange.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { startDate, endDate } = parsedDateRange.data;
  const dateStart = new Date(`${startDate}T00:00:00.000`);
  const dateEnd = new Date(`${endDate}T23:59:59.999`);

  try {
    const [lymlightOrders, fields] = await db.execute(sql<any>`
      SELECT 
        bq.order_id AS orderId,
        o.organization_name AS organizationName,
        o.organization_slug AS organizationSlug,
        o.organization_short_name AS organizationShortName
      FROM belt_queues bq
      LEFT JOIN orders o ON bq.order_id = o.order_id
      WHERE
        bq.status = 'COMPLETED'
        AND bq.affiliate_id = ${LYMLIGHT_AFFILIATE_ID}
        AND bq.shipped_at IS NOT NULL
        AND bq.shipped_at >= ${dateStart}
        AND bq.shipped_at <= ${dateEnd}
    `);

    if ((lymlightOrders as any).length === 0) {
      return NextResponse.json({
        status: "success",
        dateRange: {
          startDate,
          endDate,
        },
        shippedOrderCount: 0,
        // organizations: [],
      });
    }

    return NextResponse.json({
      status: "success",
      dateRange: {
        startDate,
        endDate,
      },
      totalCompletedOrders: (lymlightOrders as any).length,
      organizations: (lymlightOrders as any).map((order: any) => ({
        orderId: order.orderId,
        organizationName: order.organizationName,
        organizationSlug: order.organizationSlug,
        organizationShortName: order.organizationShortName,
      })),
    });
  } catch (error) {
    console.error("Error getting Lymlight shipping summary:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to get Lymlight shipping summary",
      },
      { status: 500 },
    );
  }
}
