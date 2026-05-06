"use client";

import { buildOrderSlipPdfBytes } from "@/lib/build-order-slip-pdf";

export async function generateOrderSlipPdf(
  orderId: string,
  patientName: string,
  shippingAddress: any,
  trackingNumber?: string | null
): Promise<void> {
  const pdfBytes = await buildOrderSlipPdfBytes(
    orderId,
    patientName,
    shippingAddress,
    trackingNumber
  );
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank");
}
