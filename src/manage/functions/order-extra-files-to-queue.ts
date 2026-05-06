import { db } from "@/db/db";
import {
  aliasedTable,
  eq,
  isNotNull,
  isNull,
  and,
  sql,
  inArray,
} from "drizzle-orm";
import fs from "fs";
import { tempFolder } from "../main";
import { beltQueues } from "@/db/schema";

const fileName = "order-extra-files-to-queue";

export const Run = async (args?: string[]) => {
  try {
    if (args?.[0] === "--help" || args?.[0] === "-h") {
      console.log("\n--- My Test Helper --- \n");
      console.log("bun run test " + fileName + " --help/-h\n");
      console.log("Some orders in queue");
      console.log(
        "example: bun run test " +
          fileName +
          " --orderId=123123,123123 / -id=123123,123123"
      );
      console.log("No space between orderIds, comma and =");
      console.log("All orders in queue");
      console.log("example: bun run test " + fileName);
      console.log("\nTemp folder Path: '" + tempFolder + "' \n");
      console.log("\n--------------------------------\n");
      return;
    }
    const manualOrderIds: string[] = [];
    args?.forEach((arg) => {
      if (arg.includes("orderId") || arg.includes("id")) {
        const orderIds = arg.split("=")[1].trim().split(",");
        manualOrderIds.push(...orderIds);
      }
    });

    const allBeltQueue = await db
      .select()
      .from(beltQueues)
      .where(
        manualOrderIds.length > 0
          ? inArray(beltQueues.orderId, manualOrderIds)
          : undefined
      );
    const orderIds = allBeltQueue.map((beltQueue) => beltQueue.orderId);
    const query = sql`SELECT order_id, extra_files, extra_files_created_at FROM orders WHERE order_id IN ${orderIds}`;
    const result: any = await db.execute(query);
    const orderFiles = await Promise.all(
      result[0].map(async (order: any, index: number) => {
        const updateBeltQueue = await db
          .update(beltQueues)
          .set({
            extraFiles: order.extra_files,
            extraFilesCreatedAt: sql`NOW()`,
          })
          .where(eq(beltQueues.orderId, order.order_id));
        console.log(
          "index->" +
            (index + 1) +
            " orderId->" +
            order.order_id +
            " updated in queue result->" +
            updateBeltQueue[0].affectedRows
        );
      })
    );

    console.log("My Test Completed \n");
    return true;
  } catch (error) {
    console.error(error);
    console.error("My Test Error");
    return false;
  }
};
