"use server";

import { Result } from "@/lib/types";
import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import { beltQueues, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function check(orderId: string) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication?.user) {
      return {
        status: "error",
        messages: ["You are not authorized to pull queue"],
      } as Result;
    }

    const [getQueue] = await db
      .select({
        orderId: beltQueues.orderId,
        lockedForUserId: beltQueues.lockedForUserId,
        lockedAt: beltQueues.lockedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(beltQueues)
      .leftJoin(user, eq(beltQueues.lockedForUserId, user.id))
      .where(eq(beltQueues.orderId, orderId))
      .limit(1)
      .execute();

    return {
      status: "success",
      value: getQueue,
    } as Result;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      messages: ["Error checking lock for order"],
    } as Result;
  }
}
