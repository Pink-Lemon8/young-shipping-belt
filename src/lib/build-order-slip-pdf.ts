"use client";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import bwipjs from "bwip-js";

function formatAddress(shippingAddress: any): string[] {
  const addr = shippingAddress;
  if (!addr) return [];

  const lines: string[] = [];

  const line1 = addr?.["momex:address"]?._cdata;
  if (line1) lines.push(line1);

  const line2 = addr?.["momex:address2"]?._cdata;
  if (line2) lines.push(line2);

  const line3 = addr?.["momex:address3"]?._cdata;
  if (line3) lines.push(line3);

  const city = addr?.["momex:city"]?._cdata || "";
  const state = addr?.["momex:state"]?._cdata || "";
  const postalCode = addr?.["momex:postalcode"]?._cdata || "";
  const cityLine = [city, state, postalCode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);

  const country = addr?.["momex:country"]?._cdata;
  if (country) lines.push(country);

  return lines;
}

async function generateBarcode(text: string): Promise<string> {
  const canvas = document.createElement("canvas");

  await bwipjs.toCanvas(canvas, {
    bcid: "code128",
    text: text,
    scale: 3,
    height: 20,
    includetext: false,
  });

  return canvas.toDataURL("image/png");
}

export async function buildOrderSlipPdfBytes(
  orderId: string,
  patientName: string,
  shippingAddress: any,
  trackingNumber?: string | null
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([288, 432]);

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 16;
  const contentWidth = width - margin * 2;

  let y = height - margin - 10;

  page.drawText("Order ID:", {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(orderId, {
    x: margin + 58,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  y -= 30;

  const barcodeDataUrl = await generateBarcode(orderId);
  const barcodeImageBytes = await fetch(barcodeDataUrl).then((res) =>
    res.arrayBuffer()
  );
  const barcodeImage = await pdfDoc.embedPng(barcodeImageBytes);

  const barcodeWidth = 150;
  const barcodeX = margin + (contentWidth - barcodeWidth) / 2;

  page.drawImage(barcodeImage, {
    x: barcodeX,
    y: y - 40,
    width: barcodeWidth,
    height: 40,
  });

  y -= 50;

  const barcodeTextWidth = fontBold.widthOfTextAtSize(orderId, 10);
  page.drawText(orderId, {
    x: barcodeX + (barcodeWidth - barcodeTextWidth) / 2,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  y -= 20;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.75,
    color: rgb(0.75, 0.75, 0.75),
  });

  y -= 22;

  page.drawText("Ship To:", {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  y -= 22;

  page.drawText(patientName || "N/A", {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  y -= 22;

  const addressLines = formatAddress(shippingAddress);
  addressLines.forEach((line) => {
    page.drawText(line, {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 16;
  });

  y -= 16;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.75,
    color: rgb(0.8, 0.8, 0.8),
    dashArray: [4, 4],
  });

  if (trackingNumber) {
    y -= 22;

    const trackingLabel = "Tracking Number:";
    const trackingLabelWidth = fontBold.widthOfTextAtSize(trackingLabel, 10);
    page.drawText(trackingLabel, {
      x: margin + (contentWidth - trackingLabelWidth) / 2,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    y -= 18;

    const trackingBarcodeDataUrl = await generateBarcode(trackingNumber);
    const trackingBarcodeImageBytes = await fetch(trackingBarcodeDataUrl).then(
      (res) => res.arrayBuffer()
    );
    const trackingBarcodeImage = await pdfDoc.embedPng(trackingBarcodeImageBytes);
    const trackingBarcodeWidth = 150;
    const trackingBarcodeX = margin + (contentWidth - trackingBarcodeWidth) / 2;

    page.drawImage(trackingBarcodeImage, {
      x: trackingBarcodeX,
      y: y - 40,
      width: trackingBarcodeWidth,
      height: 40,
    });

    y -= 50;

    const trackingTextWidth = fontBold.widthOfTextAtSize(trackingNumber, 10);
    page.drawText(trackingNumber, {
      x: trackingBarcodeX + (trackingBarcodeWidth - trackingTextWidth) / 2,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}
