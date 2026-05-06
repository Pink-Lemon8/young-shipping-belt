import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { logs } from "@/db/schema";
import { and, desc, eq, gte, like, lte } from "drizzle-orm";

export const schema = {
  orderId: z.string().optional().describe("Filter by order ID"),
  userId: z.string().optional().describe("Filter by user ID"),
  beltCode: z.string().optional().describe("Filter by belt code"),
  action: z.string().optional().describe("Filter by action (partial match)"),
  startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
  limit: z.number().default(50).describe("Max results (default 50, max 200)"),
  page: z.number().default(1).describe("Page number"),
};

export const metadata = {
  name: "get-belt-logs",
  description:
    "Get belt-specific audit logs from the belt_logs table. Filter by order, user, belt code, action type, date range.",
  annotations: {
    title: "Get Belt Logs",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getBeltLogs(params: InferSchema<typeof schema>) {
  const { orderId, userId, beltCode, action, startDate, endDate, limit = 50, page = 1 } = params;
  const effectiveLimit = Math.min(limit, 200);
  const offset = (page - 1) * effectiveLimit;

  const logEntries = await db.query.logs.findMany({
    where: (l, { and, eq, gte, lte, like }) =>
      and(
        orderId ? eq(l.orderId, orderId) : undefined,
        userId ? eq(l.userId, userId) : undefined,
        beltCode ? eq(l.beltCode, beltCode) : undefined,
        action ? like(l.action, `%${action}%`) : undefined,
        startDate ? gte(l.createdAt, new Date(startDate)) : undefined,
        endDate ? lte(l.createdAt, (() => { const d = new Date(endDate); d.setHours(23, 59, 59, 999); return d; })()) : undefined
      ),
    with: {
      User: { columns: { id: true, name: true, email: true } },
    },
    orderBy: [desc(logs.createdAt)],
    limit: effectiveLimit,
    offset,
  });

  return {
    content: [
      { type: "text", text: JSON.stringify({ logs: logEntries, page, count: logEntries.length }, null, 2) },
    ],
  };
}
