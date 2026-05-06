import { z } from "zod";
import { type InferSchema } from "xmcp";
import { db } from "@/db/db";
import { beltQueues } from "@/db/schema";
import { or, like } from "drizzle-orm";

export const schema = {
  query: z.string().min(2).describe("Search query (min 2 chars)"),
  limit: z.number().default(15).describe("Max results (default 15)"),
};

export const metadata = {
  name: "search-belt",
  description:
    "Search across belt queues by order ID, patient ID, patient name, or tracking number.",
  annotations: {
    title: "Search Belt",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function searchBelt(params: InferSchema<typeof schema>) {
  const { query, limit = 15 } = params;
  const term = `%${query}%`;

  const results = await db.query.beltQueues.findMany({
    where: (q, { or, like }) =>
      or(
        like(q.orderId, term),
        like(q.patientId, term),
        like(q.patientName, term),
        like(q.trackingNumber, term)
      ),
    with: {
      BoxSize: { columns: { id: true, name: true, type: true } },
      Affiliate: { columns: { id: true, name: true, code: true, pwAuthPassword: false, pwAuthUsername: false, pwLocal: false } },
    },
    limit,
    orderBy: (q, { desc }) => [desc(q.updatedAt)],
  });

  if (results.length === 0) {
    return { content: [{ type: "text", text: `No belt queue items found for "${query}".` }] };
  }

  return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
}
