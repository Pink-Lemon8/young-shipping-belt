import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { beltQueues, boxSizes, returnLabels, tempaidBoxes } from "@/db/schema";
import { eq, and, not } from "drizzle-orm";
import { timingSafeEqual } from "crypto";
import "dotenv/config";

const MAX_ORDER_ID_LENGTH = 128;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId: string = (searchParams.get("orderId") ?? "").trim();
  // Prefer Authorization header; fallback to AUTH query for backward compatibility
  const auth =
    req.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim() ?? (searchParams.get("AUTH") ?? "").trim();

  if (!auth) {
    return NextResponse.json(
      { status: "error", message: "Authentication token is required" },
      { status: 400 },
    );
  }
  const expectedAuth = process.env.LYMLIGHT_API_AUTH;
  if (!expectedAuth) {
    return NextResponse.json(
      { status: "error", message: "Authentication token is not configured" },
      { status: 500 },
    );
  }
  try {
    const authBuf = Buffer.from(auth, "utf8");
    const expectedBuf = Buffer.from(expectedAuth, "utf8");
    if (
      authBuf.length !== expectedBuf.length ||
      !timingSafeEqual(authBuf, expectedBuf)
    ) {
      return NextResponse.json(
        { status: "error", message: "Invalid authentication token" },
        { status: 401 },
      );
    }
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid authentication token" },
      { status: 401 },
    );
  }

  if (!orderId || orderId.length > MAX_ORDER_ID_LENGTH) {
    return NextResponse.json(
      { status: "error", message: "Invalid authentication token" },
      { status: 401 },
    );
  }

  if (!orderId || orderId.trim() === "") {
    return NextResponse.json(
      { status: "error", message: "Order ID is required" },
      { status: 400 },
    );
  }

  try {
    const [getQueue] = await db
      .select({
        orderId: beltQueues.orderId,
        status: beltQueues.status,
        images: beltQueues.images,
        boxSize: boxSizes,
        tempaidBox: tempaidBoxes,
      })
      .from(beltQueues)
      .leftJoin(boxSizes, eq(beltQueues.boxSizeId, boxSizes.id))
      .leftJoin(tempaidBoxes, eq(beltQueues.tempaidBoxId, tempaidBoxes.id))
      .where(
        and(
          eq(beltQueues.orderId, orderId),
          not(eq(beltQueues.status, "SENT_TO_BELT")),
          eq(beltQueues.affiliateId, -1),
        ),
      )
      .limit(1);

    if (!getQueue) {
      return NextResponse.json(
        { status: "error", message: "Order not found in queue" },
        { status: 404 },
      );
    }

    let returnLabel: any | null = null;
    if (getQueue.tempaidBox)
      [returnLabel] = await db
        .select({
          trackingNumber: returnLabels.trackingNumber,
          labelUrl: returnLabels.labelUrl,
          trackingUrlProvider: returnLabels.trackingUrlProvider,
        })
        .from(returnLabels)
        .where(
          and(
            eq(returnLabels.tempaidBoxId, getQueue.tempaidBox.id),
            eq(returnLabels.orderId, `LYM-${getQueue.orderId}`),
          ),
        )
        .limit(1);

    const mapGetQueue = {
      orderId: getQueue.orderId,
      status: getQueue.status,
      image:
        getQueue.images?.find((image) => image.name.includes("_stage3.jpeg")) ??
        null,
      boxSize: getQueue.boxSize,
      tempaidBox: getQueue.tempaidBox ?? null,
      returnLabel: returnLabel ?? null,
    };

    return NextResponse.json({
      status: "success",
      order: mapGetQueue,
    });
  } catch (error) {
    console.error("Error checking Lymlight order in queue:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check Lymlight order",
      },
      { status: 500 },
    );
  }
}
