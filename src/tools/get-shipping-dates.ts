import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues, affiliates } from "@/db/schema";
import { and, count, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";

export const schema = {
  startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
  beltCode: z.string().optional().describe("Filter by belt code"),
  affiliateId: z.number().optional().describe("Filter by affiliate ID"),
  orderIds: z.array(z.string()).optional().describe("Look up specific order IDs"),
  groupBy: z
    .enum(["day", "affiliate", "belt"])
    .default("day")
    .describe("Group results by: day, affiliate, or belt"),
  limit: z.number().default(100).describe("Max results for individual order lookups (default 100)"),
};

export const metadata = {
  name: "get-shipping-dates",
  description:
    "Get real shipping dates for completed belt orders. The shippedAt timestamp on a COMPLETED order is the actual shipping date (when it went to cage after Stage 3). Use this for shipping throughput, actual ship dates, and reconciliation. Supports grouping by day/affiliate/belt.",
  annotations: {
    title: "Get Shipping Dates",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getShippingDates(params: InferSchema<typeof schema>) {
  const { startDate, endDate, beltCode, affiliateId, orderIds, groupBy = "day", limit = 100 } = params;

  // If looking up specific orders, return their individual ship dates
  if (orderIds?.length) {
    const orders = await db.query.beltQueues.findMany({
      where: (q, { and, inArray, eq }) =>
        and(inArray(q.orderId, orderIds), eq(q.status, "COMPLETED")),
      columns: {
        orderId: true,
        beltCode: true,
        cageCode: true,
        shippedAt: true,
        trackingNumber: true,
        shippingMethod: true,
        affiliateId: true,
        patientName: true,
      },
      orderBy: (q, { desc }) => [desc(q.shippedAt)],
      limit: Math.min(limit, 500),
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              orders: orders.map((o) => ({
                ...o,
                realShipDate: o.shippedAt ? new Date(o.shippedAt).toISOString().split("T")[0] : null,
              })),
              count: orders.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Otherwise, aggregate shipping data
  const conditions: any[] = [eq(beltQueues.status, "COMPLETED"), isNotNull(beltQueues.shippedAt)];

  if (startDate) conditions.push(gte(beltQueues.shippedAt, new Date(startDate)));
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(beltQueues.shippedAt, end));
  }
  if (beltCode) conditions.push(eq(beltQueues.beltCode, beltCode.charAt(0)));
  if (affiliateId) conditions.push(eq(beltQueues.affiliateId, affiliateId));

  const whereClause = and(...conditions);

  if (groupBy === "day") {
    const byDay = await db
      .select({
        shipDate: sql<string>`DATE(${beltQueues.shippedAt})`,
        count: count(),
      })
      .from(beltQueues)
      .where(whereClause)
      .groupBy(sql`DATE(${beltQueues.shippedAt})`)
      .orderBy(desc(sql`DATE(${beltQueues.shippedAt})`));

    return { content: [{ type: "text", text: JSON.stringify({ byDay, total: byDay.reduce((s, d) => s + d.count, 0) }, null, 2) }] };
  }

  if (groupBy === "affiliate") {
    const byAffiliate = await db
      .select({
        affiliateId: beltQueues.affiliateId,
        affiliateName: affiliates.name,
        count: count(),
      })
      .from(beltQueues)
      .leftJoin(affiliates, eq(beltQueues.affiliateId, affiliates.id))
      .where(whereClause)
      .groupBy(beltQueues.affiliateId)
      .orderBy(desc(count()));

    return { content: [{ type: "text", text: JSON.stringify({ byAffiliate }, null, 2) }] };
  }

  // groupBy === "belt"
  const byBelt = await db
    .select({
      beltCode: beltQueues.beltCode,
      count: count(),
    })
    .from(beltQueues)
    .where(whereClause)
    .groupBy(beltQueues.beltCode)
    .orderBy(desc(count()));

  return { content: [{ type: "text", text: JSON.stringify({ byBelt }, null, 2) }] };
}
