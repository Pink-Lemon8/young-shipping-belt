import { db } from "@/db/db";
import { eq, isNotNull, and, inArray, gte, lte, sql, or } from "drizzle-orm";
import fs from "fs";
import { z } from "zod";
import { tempFolder } from "../main";
import { setConfig } from "@/server/controller/config";
import { setLymlightOrderInfo } from "@/server/lymlight";
import { beltQueuePharmacistReview, beltQueues, orderExpectedItems, orderItems } from "@/db/schema";


const fileName = "count-sell-items";

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
  orderIds: string[] | null;
  lotNumbers: string[] | null;
  din: string | null;
}

export const Run = async (args?: string[]) => {
  try {
    if (args?.[0] === "--help" || args?.[0] === "-h") {
      console.log("\n--- Count Sell Items Helper --- \n");
      console.log("bun run manage " + fileName + " --help/-h");
      console.log("bun run manage " + fileName + " [date]");
      console.log("Example: bun run manage " + fileName + " YYYY-MM-DD YYYY-MM-DD");

      console.log("\nTemp folder Path: '" + tempFolder + "' \n");
      console.log("\n--------------------------------\n");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const parsedDateRange = dateRangeSchema.safeParse({
      startDate: args?.[0] || today,
      endDate: args?.[1] || args?.[0] || today,
    });

    if (!parsedDateRange.success) {
      console.error("Invalid date input:");
      parsedDateRange.error.issues.forEach((issue) => {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
      });
      console.error(`Example: bun run manage ${fileName} 2026-04-01 2026-04-09`);
      return false;
    }

    const { startDate, endDate } = parsedDateRange.data;
    const dateStart = new Date(`${startDate} 00:00:00`);
    const dateEnd = new Date(`${endDate} 23:59:59`);

    console.log("Date:", startDate, "to", endDate, "\n");

    const allOrders = await db
      .select({
        orderId: beltQueues.orderId,
      })
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.status, "COMPLETED"),
          or(
            startDate ? and(
              gte(beltQueues.shippedAt, dateStart),
              lte(beltQueues.shippedAt, dateEnd)
            ) : undefined
          )
        )
      )
      .groupBy(beltQueues.id);

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
          or(
            eq(orderItems.packageId, orderExpectedItems.packageId),
          ),
          eq(orderItems.orderId, orderExpectedItems.orderId),
        ),
      )
      .where(inArray(orderItems.orderId, allOrders.map((item: any) => item.orderId)));

    const normalizePackageId = (value: string | null | undefined) =>
      value?.replace(/^PP-/, "INV-") ?? "";

    const uniqueOrderItemsMap = new Map<string, any>();

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
      bypassPackageIds.map((packageId) => normalizePackageId(packageId)).filter(Boolean)
    );

    const packageIdSet = new Set(
      uniqueOrderItems
        .map((item: any) => normalizePackageId(item.packageId))
        .filter(Boolean)
    );
    let totalQuantity = 0;
    const groupedInPackageId = uniqueOrderItems.reduce((acc: any, item: any) => {
      const packageId = normalizePackageId(item.packageId);
      const legacyId = normalizePackageId(item.legacyId);
      const matchedPackageId = legacyId && packageIdSet.has(legacyId) ? legacyId : packageId;

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
        } as SellItem;
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
      totalQuantity += quantity;
      return acc;
    }, {});


    const items = Object.values(groupedInPackageId)
      .sort((a: any, b: any) => b.quantity - a.quantity);

    console.table(items.map((item: any) => ({
      packageId: item.packageId,
      description: item.description,
      quantity: item.quantity,
      legacyId: item.legacyId,
      // din: item.din,
      // orderCount: item.orderIds?.length ?? 0,
    })));

    console.log("Date:", startDate, "to", endDate, "\n");

    console.log("Order counts:", allOrders.length)
    console.log("Total item quantity:", totalQuantity)

    console.log("--------------------------------\n");
    return true;
  } catch (error) {
    console.error(error);
    console.error("Sell Items Count Failed");
    return false;
  }
};
