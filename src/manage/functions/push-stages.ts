import { db } from "@/db/db";
import { beltQueues, files } from "@/db/schema";
import {
  aliasedTable,
  eq,
  isNotNull,
  isNull,
  and,
  inArray,
  sql,
} from "drizzle-orm";

const fileName = "copy-label-to-belt";

export const Run = async (args?: string[]) => {
  try {
    if (args?.[0] === "--help" || args?.[0] === "-h") {
      console.log("\n--- Copy Label to Belt Helper --- \n");
      console.log("bun run test " + fileName + " --help/-h");
      console.log("Example: bun run test " + fileName);
      // console.log("\nTemp folder Path: '" + tempFolder + "' \n");
      console.log("\n--------------------------------\n");
      return;
    }
    console.log("Copy Label to Belt Started \n");

    const orderIds: string[] = [];
    const stage = "3";

    const getBeltQueues = await db
      .select()
      .from(beltQueues)
      .where(and(inArray(beltQueues.orderId, orderIds)));

    for (const [index, beltQueue] of getBeltQueues.entries()) {
      const orderId = beltQueue.orderId;
      const images = beltQueue.images;

      const filteredImages = images
        ?.filter((image: any) => {
          return image.name.includes(`stage${stage}`) === false;
        })
        .filter((image: any) => {
          return image !== undefined;
        });

      const [updateBeltQueue] = await db
        .update(beltQueues)
        .set({
          images: filteredImages,
          status: "STAGE3",
        })
        .where(eq(beltQueues.orderId, orderId));

      if (updateBeltQueue.affectedRows === 0) {
        console.log(index + 1, "|", "Order ID: ", orderId, "|", "Not Updated");
      } else {
        console.log(index + 1, "|", "Order ID: ", orderId, "|", "Updated");
      }
    }

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    await delay(10000);

    console.log("Copy Label to Belt Completed \n");

    return true;
  } catch (error) {
    console.error(error);
    console.error("Copy Label to Belt Error");
    return false;
  }
};
