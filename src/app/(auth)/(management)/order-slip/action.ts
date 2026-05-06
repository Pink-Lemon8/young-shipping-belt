"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import { beltQueues } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { Result } from "@/lib/types";
import { headers } from "next/headers";
import {
  getOrderDetailsFromLym,
  getOrderDetailsFromPw,
} from "@/server/controller/orders";

const AllowedBeltCodes = ["C"];
export async function getOrderSlipData(orderId: string): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user) {
      return {
        status: "error",
        messages: ["You must be logged in"],
      } as Result;
    }

    const [queue] = await db
      .select()
      .from(beltQueues)
      .where(and(eq(beltQueues.orderId, orderId), inArray(beltQueues.beltCode, AllowedBeltCodes)))
      .limit(1);

    if (!queue) {
      return {
        status: "error",
        messages: ["Order not found in belt queue"],
      } as Result;
    }

    let orderDetails;

    if (queue.affiliateId === -1) {
      orderDetails = await getOrderDetailsFromLym(queue);
    } else {
      orderDetails = await getOrderDetailsFromPw(
        queue.orderId,
        queue.patientId ?? ""
      );
    }

    if (!orderDetails || orderDetails.status !== "success") {
      return {
        status: "error",
        messages: ["Failed to fetch order details"],
      } as Result;
    }

    return {
      status: "success",
      value: {
        patientName: orderDetails.value.patientName,
        shippingAddress: orderDetails.value.shippingAddress,
        trackingNumber: queue.trackingNumber,
      },
    } as Result;
  } catch (error) {
    console.error("Error getting order slip data:", error);
    return {
      status: "error",
      messages: ["An error occurred while fetching order data"],
    } as Result;
  }
}
