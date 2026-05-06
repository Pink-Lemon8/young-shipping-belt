"use server";

import { NextRequest, NextResponse } from "next/server";

const LYMLIGHT_URL = "https://lymlight.com";
const LYMLIGHT_URL_TEST = "http://localhost:3000";
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1465626107016515677/-7y3AQqQazzMVmHJFs_HzndJWqjRGDEi97qNttFWVg_V9jj-o1dISXTxjGw7qb7mOtRK";

async function sendDiscordAlert(
  packageId: string,
  error: string,
  stockChange: number,
) {
  try {
    const message = {
      embeds: [
        {
          title: "⚠️ Inventory Sync Failed",
          color: 0xff0000,
          fields: [
            { name: "Package ID", value: packageId, inline: true },
            { name: "Attempted Change", value: `${stockChange}`, inline: true },
            { name: "Error", value: error },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.log("Failed to send Discord alert:", e);
  }
}

export async function getBaseURL() {
  const app_env = process.env.APP_ENV || "development";
  return ["production"].includes(app_env) ? LYMLIGHT_URL : LYMLIGHT_URL_TEST;
}

export async function updateLymlightInventory(
  items: Array<{ packageId: string; quantity: number }>,
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const baseURL = await getBaseURL();

  for (const item of items) {
    try {
      const { packageId, quantity } = item;
      let body: { id?: number; legacyId?: string; stockChange: number };

      if (packageId.startsWith("PP-")) {
        // Lymlight inventory ID - extract number after PP-
        const id = parseInt(packageId.replace("PP-", ""), 10);
        body = { id, stockChange: -quantity };
      } else if (packageId.startsWith("DP-")) {
        // PharmacyWire legacy ID - use full string
        body = { legacyId: packageId, stockChange: -quantity };
      } else {
        errors.push(`Unknown package ID format: ${packageId}`);
        continue;
      }

      const response = await fetch(
        `${baseURL}/api/belt/inventory/update?AUTH=${process.env.LYMLIGHT_API_AUTH}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        errors.push(
          `Failed to update inventory for ${packageId}: ${errorData}`,
        );
        // Send Discord alert for inventory sync failures
        if (
          errorData.includes("not found") ||
          errorData.includes("Insufficient stock")
        ) {
          await sendDiscordAlert(packageId, errorData, -quantity);
        }
      }
    } catch (error) {
      errors.push(`Error updating inventory for ${item.packageId}: ${error}`);
    }
  }

  return { success: errors.length === 0, errors };
}

const orderStatuses = [
  "Picking",
  "Final_Check",
  "Ready_To_Ship",
  "In_Transit",
  "Delivered",
  "Closed",
];

export async function setLymlightOrderInfo({
  orderId,
  newStatus,
  shippingMethod,
  trackingNumber,
  shippingDate,
}: {
  orderId: string;
  newStatus?: (typeof orderStatuses)[number] | null;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  shippingDate?: Date | null;
}) {
  try {
    const baseURL = await getBaseURL();
    const lymlightOrderId = orderId.replace(/^lym-/i, "");

    const response = await fetch(
      `${baseURL}/api/belt/order/update/${lymlightOrderId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LYMLIGHT_API_AUTH}`,
        },
        body: JSON.stringify({
          newStatus,
          trackingNumber,
          shippingDate,
          shippingMethod,
        }),
      },
    );
    if (!response.ok) {
      const errorData = await response.text();
      console.log("Lymlight - Error Response Body -> ", errorData);
      console.log("Lymlight - Error Response -> ", response);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Lymlight - Error -> ", error);
    return null;
  }
}
