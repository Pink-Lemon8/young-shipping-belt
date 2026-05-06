import { db } from "@/db/db";
import {
  aliasedTable,
  eq,
  isNotNull,
  isNull,
  and,
  inArray,
  not,
  desc,
} from "drizzle-orm";
import fs from "fs";
import { tempFolder } from "../main";
import { setConfig } from "@/server/controller/config";
import { setLymlightOrderInfo } from "@/server/lymlight";
import { beltQueuePharmacistReview, beltQueues } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { getOrderDetailsFromLym } from "@/server/controller/orders";
import { UTApi } from "uploadthing/server";

const fileName = "lym-orders";

const utapi = new UTApi();

const orderIds: string[] | undefined = undefined;

export const Run = async (args?: string[]) => {
  try {
    if (args?.[0] === "--help" || args?.[0] === "-h") {
      console.log("\n--- Lym Orders Helper --- \n");
      console.log("bun run manage " + fileName + " --help/-h");

      console.log("\nTemp folder Path: '" + tempFolder + "' \n");
      console.log("\n--------------------------------\n");
      return;
    }

    const getOrders = await db
      .select()
      .from(beltQueues)
      .where(
        and(
          eq(beltQueues.affiliateId, -1),
          orderIds ? inArray(beltQueues.orderId, orderIds) : undefined,
          inArray(beltQueues.status, ["COMPLETED", "STAGE3"]),
          not(inArray(beltQueues.shippingMethod, ["CANADA_POST"]))
        )
      )
      .orderBy(desc(beltQueues.updatedAt));

    // INSERT_YOUR_CODE
    // Extract relevant fields from orders, write to CSV
    if (!getOrders || getOrders.length === 0) {
      console.log("No orders found to export.");
    } else {
      // Define CSV header
      const csvHeaders = [
        "orderId",
        "trackingNumber",
        "shippingDate",
        "shippingMethod",
        "status",
        "patientName",
        "shipToAddress",
      ];

      // Gather rows for each order
      const csvRows = [csvHeaders.join(",")];

      for (const order of getOrders) {
        const orderDetails = await getOrderDetailsFromLym(order);

        try {
          const fileUrlResult = await utapi.getSignedURL(order.label[0].key);
          const url = fileUrlResult?.url;
          if (url) {
            const res = await fetch(url);
            if (!res.ok) {
              console.log(
                `❌ ${order.orderId} - Failed to download file for order ${order.orderId}: ${res.statusText}`
              );
              try {
                await fs.appendFileSync(
                  `${tempFolder}/labels/logs.txt`,
                  `❌ ${order.orderId} - Failed to download file for order ${order.orderId}: ${res.statusText}\n`,
                  "utf8"
                );
              } catch (error) {
                console.log(error);
              }
              continue;
            }

            // Get the label creation date
            let labelDate = order.labelCreatedAt
              ? new Date(order.labelCreatedAt)
              : new Date();

            // Format year and month for folder structure: YYYY-MM
            const yyyy = labelDate.getFullYear();
            const mm = String(labelDate.getMonth() + 1).padStart(2, "0");
            const dd = String(labelDate.getDate()).padStart(2, "0");
            const monthlyFolder = `${tempFolder}/labels/`;

            // Ensure the monthly folder exists
            if (!fs.existsSync(monthlyFolder)) {
              fs.mkdirSync(monthlyFolder, { recursive: true });
            }

            const buffer = Buffer.from(await res.arrayBuffer());
            const tempFilePath = `${monthlyFolder}/${order.orderId}_${order.trackingNumber}_${order.shippingMethod?.toLowerCase().replace("_", "") ?? ""}.pdf`;
            await fs.writeFileSync(tempFilePath, buffer);
            console.log(
              `✅ ${order.orderId} - Saved label for order ${order.orderId} to ${tempFilePath}`
            );
            try {
              await fs.appendFileSync(
                `${tempFolder}/labels/logs.txt`,
                `✅ ${order.orderId} - Saved label for order ${order.orderId} to ${tempFilePath}\n`,
                "utf8"
              );
            } catch (error) {
              console.log(error);
            }
          } else {
            console.log(
              `🔗 ${order.orderId} - No URL found for order ${order.orderId}`
            );
            try {
              await fs.appendFileSync(
                `${tempFolder}/labels/logs.txt`,
                `🔗 ${order.orderId} - No URL found for order ${order.orderId}\n`,
                "utf8"
              );
            } catch (error) {
              console.log(error);
            }
          }
        } catch (error) {
          console.log(
            `💥 ${order.orderId} - Error processing order ${order.orderId}:`,
            error
          );
          try {
            await fs.appendFileSync(
              `${tempFolder}/labels/logs.txt`,
              `💥 ${order.orderId} - Error processing order ${order.orderId}: ${error}\n`,
              "utf8"
            );
          } catch (error) {
            console.log(error);
          }
        }

        const row = [
          order.orderId ?? "",
          order.trackingNumber?.toString() ?? "",
          order.updatedAt ? formatDate(order.updatedAt) : "",
          order.shippingMethod ?? "",
          order.status ?? "",
          orderDetails?.value?.patientName ?? "",
          (orderDetails?.value?.shippingAddress["momex:address"]?._cdata ??
            "") +
            " " +
            (orderDetails?.value?.shippingAddress["momex:address2"]?._cdata
              ? orderDetails?.value?.shippingAddress["momex:address2"]?._cdata +
                " "
              : "") +
            (orderDetails?.value?.shippingAddress["momex:address3"]?._cdata
              ? orderDetails?.value?.shippingAddress["momex:address3"]?._cdata +
                " "
              : "") +
            (orderDetails?.value?.shippingAddress["momex:city"]?._cdata
              ? orderDetails?.value?.shippingAddress["momex:city"]?._cdata + " "
              : "") +
            (orderDetails?.value?.shippingAddress["momex:state"]?._cdata
              ? orderDetails?.value?.shippingAddress["momex:state"]?._cdata +
                " "
              : "") +
            (orderDetails?.value?.shippingAddress["momex:country"]?._cdata
              ? orderDetails?.value?.shippingAddress["momex:country"]?._cdata +
                " "
              : "") +
            (orderDetails?.value?.shippingAddress["momex:postalcode"]?._cdata
              ? orderDetails?.value?.shippingAddress["momex:postalcode"]?._cdata
              : ""),
        ];
        // Escape possible commas
        const formattedRow = row.map((v) =>
          typeof v === "string" && v.includes(",")
            ? `"${v.replace(/"/g, '""')}"`
            : v
        );
        csvRows.push(formattedRow.join(","));
      }

      // Write to file
      const csvString = csvRows.join("\n");
      const outPath = `${tempFolder}/lym_orders_${Date.now()}.csv`;
      fs.writeFileSync(outPath, csvString);

      console.log(`CSV file created at: ${outPath}`);
    }

    console.log("My Test Completed \n");
    return true;
  } catch (error) {
    console.error(error);
    console.error("My Test Error");
    return false;
  }
};
