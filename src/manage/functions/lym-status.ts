import { db } from "@/db/db";
import { eq, isNotNull, and, inArray, gte, lte, sql, or } from "drizzle-orm";
import fs from "fs";
import { tempFolder } from "../main";
import { setConfig } from "@/server/controller/config";
import { setLymlightOrderInfo } from "@/server/lymlight";
import { beltQueuePharmacistReview, beltQueues } from "@/db/schema";

const fileName = "lym-status";


export const Run = async (args?: string[]) => {
  try {
    if (args?.[0] === "--help" || args?.[0] === "-h") {
      console.log("\n--- Lym Status Helper --- \n");
      console.log("bun run manage " + fileName + " --help/-h");

      console.log("\nTemp folder Path: '" + tempFolder + "' \n");
      console.log("\n--------------------------------\n");
      return;
    }

    const orderIds: string[] = [];
    const today = new Date().toISOString().split('T')[0];
    const date = today;
    const dateStart = new Date(date + " 00:00:00");
    const dateEnd = new Date(date + " 23:59:59");
    if (orderIds.length > 0) {
      console.log("Order IDs:", orderIds, "\n");
    }
    else {
      console.log("Date:", date, "\n");
    }

    const getOrders = await db
      .select({
        ...(beltQueues as any),
        pharmacistReviewCount: sql<number>`COUNT(${beltQueuePharmacistReview.orderId})`.as(
          "pharmacist_review_count"
        ),
      })
      .from(beltQueues)
      .leftJoin(
        beltQueuePharmacistReview,
        eq(beltQueues.orderId, beltQueuePharmacistReview.orderId)
      )
      .where(
        and(
          eq(beltQueues.affiliateId, -1),
          eq(beltQueues.status, "COMPLETED"),
          or(
            orderIds.length > 0 ? inArray(beltQueues.orderId, orderIds) : undefined,
            date && orderIds.length === 0 ? and(
              gte(beltQueues.shippedAt, dateStart),
              lte(beltQueues.shippedAt, dateEnd)
            ) : undefined
          )
        )
      )
      .groupBy(beltQueues.id);

    const getPharmacistReview = await db
      .select()
      .from(beltQueuePharmacistReview)
      .where(
        and(
          inArray(
            beltQueuePharmacistReview.orderId,
            getOrders.map((order: any) => order.orderId)
          ),
          isNotNull(beltQueuePharmacistReview.pharmacistId),
          eq(beltQueuePharmacistReview.status, "APPROVED")
        )
      );

    const mapOrders = getOrders
      .map((order: any) => {
        const pharmacistReview = getPharmacistReview.filter(
          (review: any) => review.orderId === order.orderId
        );
        if (pharmacistReview.length >= 2)
          return {
            ...order,
            pharmacistApproved: pharmacistReview.length >= 2 ? true : false,
            pharmacistReview: pharmacistReview,
          };
        return null;
      })
      .filter((order: any) => order !== null);

    const total = mapOrders.length;

    console.log("Total Orders to Update:", total, "\n");
    console.log("Updating Orders...\n");
    console.log("--------------------------------\n");
    let count = 0;


    for (const order of mapOrders) {
      count++;
      await setLymlightOrderInfo({
        orderId: order.orderId,
        newStatus: order.pharmacistApproved ? "In_Transit" : "Final_Check",
        shippingMethod: order.pharmacistApproved ? order.shippingMethod : null,
        trackingNumber: order.pharmacistApproved ? order.trackingNumber : null,
        shippingDate: order.pharmacistApproved ? order.updatedAt : null,
      });
      console.log(
        count.toString().padStart(3, "0"),
        " / ",
        total.toString(),
        " - Order:",
        order.orderId,
        "Status:",
        order.pharmacistApproved ? "In_Transit" : "Final_Check"
      );
    }
    console.log("--------------------------------\n");
    console.log("Orders Updated Successfully\n");
    return true;
  } catch (error) {
    console.error(error);
    console.error("Orders Update Failed");
    return false;
  }
};
