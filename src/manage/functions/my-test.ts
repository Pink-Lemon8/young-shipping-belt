import { db } from "@/db/db";
import { aliasedTable, eq, isNotNull, isNull, and } from "drizzle-orm";
import fs from "fs";
import { tempFolder } from "../main";
import { setConfig } from "@/server/controller/config";
import { setLymlightOrderInfo } from "@/server/lymlight";
import { beltQueues } from "@/db/schema";

const fileName = "my-test";

export const Run = async (args?: string[]) => {
  try {
    if (args?.[0] === "--help" || args?.[0] === "-h") {
      console.log("\n--- My Test Helper --- \n");
      console.log("bun run test " + fileName + " --help/-h");

      console.log("\nTemp folder Path: '" + tempFolder + "' \n");
      console.log("\n--------------------------------\n");
      return;
    }

    console.log("My Test Started \n");
    console.log("args", args, "\n");

    console.log("My Test Completed \n");
    return true;
  } catch (error) {
    console.error(error);
    console.error("My Test Error");
    return false;
  }
};
