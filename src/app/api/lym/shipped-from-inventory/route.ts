import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { and, eq, gte, inArray, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/db";
import {
  beltQueues,
  orderExpectedItems,
  orderItems,
} from "@/db/schema";
import "dotenv/config";

const bypassPackageIds = [
  "DP-17441",
  "DP-17438",
  "DP-17437",
  "DP-17387",
  "DP-17439",
  "DP-17372",
];

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

type SellItem = {
  packageId: string;
  description: string | null;
  quantity: number;
  legacyId: string | null;
  orderIds: string[];
  lotNumbers: string[];
  din: string | null;
};

const normalizePackageId = (value: string | null | undefined) =>
  value?.replace(/^PP-/, "INV-") ?? "";

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
  const dateStart = new Date(`${startDate} 00:00:00`);
  const dateEnd = new Date(`${endDate} 23:59:59`);

  try {
    const allOrders = await db
      .select({
        orderId: beltQueues.orderId,
      })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.status, "COMPLETED"),
          or(and(gte(beltQueues.shippedAt, dateStart), lte(beltQueues.shippedAt, dateEnd))),
        ),
      )
      .groupBy(beltQueues.id);

    if (allOrders.length === 0) {
      return NextResponse.json({
        status: "success",
        dateRange: {
          startDate,
          endDate,
        },
        orderCount: 0,
        totalItemQuantity: 0,
        items: [],
      });
    }

    const allOrderItems = await db
      .select({
        orderId: orderItems.orderId,
        packageId: orderItems.packageId,
        quantity: orderItems.quantity,
        description: orderExpectedItems.description,
        lotNumber: orderItems.lotNumber,
        din: orderItems.din,
        legacyId: orderItems.legacyId,
      })
      .from(orderItems)
      .leftJoin(
        orderExpectedItems,
        and(
          or(eq(orderItems.packageId, orderExpectedItems.packageId)),
          eq(orderItems.orderId, orderExpectedItems.orderId),
        ),
      )
      .where(inArray(orderItems.orderId, allOrders.map((item) => item.orderId)));

    const uniqueOrderItemsMap = new Map<
      string,
      (typeof allOrderItems)[number]
    >();

    for (const item of allOrderItems) {
      const uniqueKey = [
        item.orderId,
        item.packageId,
        item.lotNumber ?? "",
        item.legacyId ?? "",
        item.din ?? "",
        String(item.quantity),
      ].join("::");

      const existingItem = uniqueOrderItemsMap.get(uniqueKey);
      if (!existingItem) {
        uniqueOrderItemsMap.set(uniqueKey, item);
        continue;
      }

      if (!existingItem.description && item.description) {
        uniqueOrderItemsMap.set(uniqueKey, {
          ...existingItem,
          description: item.description,
        });
      }
    }

    const uniqueOrderItems = Array.from(uniqueOrderItemsMap.values());

    const bypassPackageIdSet = new Set(
      bypassPackageIds.map((packageId) => normalizePackageId(packageId)).filter(Boolean),
    );

    const packageIdSet = new Set(
      uniqueOrderItems.map((item) => normalizePackageId(item.packageId)).filter(Boolean),
    );

    let totalItemQuantity = 0;

    const groupedInPackageId = uniqueOrderItems.reduce<Record<string, SellItem>>(
      (acc, item) => {
        const packageId = normalizePackageId(item.packageId);
        const legacyId = normalizePackageId(item.legacyId);
        const matchedPackageId =
          legacyId && packageIdSet.has(legacyId) ? legacyId : packageId;

        if (!matchedPackageId) return acc;
        if (bypassPackageIdSet.has(matchedPackageId)) return acc;
        if (bypassPackageIdSet.has(packageId)) return acc;
        if (legacyId && bypassPackageIdSet.has(legacyId)) return acc;

        if (!acc[matchedPackageId]) {
          acc[matchedPackageId] = {
            packageId: matchedPackageId,
            description: item.description ?? null,
            din: item.din,
            quantity: 0,
            orderIds: [],
            lotNumbers: [],
            legacyId: item.legacyId,
          };
        }

        if (!acc[matchedPackageId].description && item.description) {
          acc[matchedPackageId].description = item.description;
        }

        if (!acc[matchedPackageId].legacyId && item.legacyId) {
          acc[matchedPackageId].legacyId = item.legacyId;
        }

        if (packageId.startsWith("INV-")) {
          acc[matchedPackageId].packageId = packageId;
        }

        if (!acc[matchedPackageId].orderIds.includes(item.orderId)) {
          acc[matchedPackageId].orderIds.push(item.orderId);
        }

        if (
          item.lotNumber &&
          !acc[matchedPackageId].lotNumbers.includes(item.lotNumber)
        ) {
          acc[matchedPackageId].lotNumbers.push(item.lotNumber);
        }

        const quantity = Number(item.quantity);
        acc[matchedPackageId].quantity += quantity;
        totalItemQuantity += quantity;

        return acc;
      },
      {},
    );

    const items = Object.values(groupedInPackageId).sort(
      (a, b) => b.quantity - a.quantity,
    );

    return NextResponse.json({
      status: "success",
      dateRange: {
        startDate,
        endDate,
      },
      orderCount: allOrders.length,
      totalItemQuantity,
      items,
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
