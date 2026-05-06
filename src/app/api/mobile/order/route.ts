import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import {
  beltQueues,
  logs,
  beltQueuePharmacistReview,
  users,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import { URLToBase64 } from "@/server/pharmacyWR/utils";

const utapi = new UTApi();

const getSchema = z.object({
  orderId: z
    .number({ required_error: "Order ID is required" })
    .or(z.array(z.number({ required_error: "Order ID is required" })))
    .transform((val) =>
      [val]
        .flat()
        .slice(0, 10)
        .map((v) => v.toString())
    ),
});

export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const headers = req.headers;

  const authorization = headers.get("authorization");
  const [type, token] = authorization?.split(" ") ?? [];

  if (type !== "Bearer") {
    return NextResponse.json(
      { error: "Invalid authorization type." },
      { status: 400 }
    );
  }
  if (!process.env.MOBILE_AUTH_TOKEN) {
    return NextResponse.json(
      { error: "Authorization token is not configured." },
      { status: 500 }
    );
  }

  if (token?.trim() !== process.env.MOBILE_AUTH_TOKEN.trim()) {
    return NextResponse.json(
      {
        error: "Invalid authorization token.",
      },
      { status: 401 }
    );
  }

  try {
    const bodyText = await req.text();
    if (!bodyText || (bodyText?.trim().length ?? 0) === 0) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const bodyData = JSON.parse(bodyText);
    const validatedBody = getSchema.parse(bodyData);

    const getOrderFromQueue = await db
      .select({
        orderId: beltQueues.orderId,
        status: beltQueues.status,
        shippingMethod: beltQueues.shippingMethod,
        beltCode: beltQueues.beltCode,
        cageCode: beltQueues.cageCode,
        images: beltQueues.images,
        skipped: beltQueues.skipped,
        skippedByUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
        skippedAt: beltQueues.skippedAt,
        shippedReason: beltQueues.comments,
        createdAt: beltQueues.createdAt,
      })
      .from(beltQueues)
      .where(inArray(beltQueues.orderId, validatedBody.orderId))
      .leftJoin(users, eq(beltQueues.skippedBy, users.id))
      .execute();

    const getPharmacistReview = await db
      .select({
        orderId: beltQueuePharmacistReview.orderId,
        status: beltQueuePharmacistReview.status,
        reason: beltQueuePharmacistReview.reason,
        createdAt: beltQueuePharmacistReview.createdAt,
        reviewBy: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(beltQueuePharmacistReview)
      .leftJoin(users, eq(beltQueuePharmacistReview.pharmacistId, users.id))
      .where(inArray(beltQueuePharmacistReview.orderId, validatedBody.orderId))
      .execute();

    const getLogs = await db
      .select({
        userId: logs.userId,
        orderId: logs.orderId,
        action: logs.action,
        description: logs.description,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
        createdAt: logs.createdAt,
      })
      .from(logs)
      .leftJoin(users, eq(logs.userId, users.id))
      .where(inArray(logs.orderId, validatedBody.orderId))
      .execute();

    const imageKeys: string[] =
      getOrderFromQueue
        .map((item) => item.images)
        .flat()
        .filter((item) => item !== null && item !== undefined)
        .map((item) => item?.key) ?? [];

    const imagesUrls: Record<string, string> = {};
    for (const key of imageKeys) {
      const getimage = await utapi.getSignedURL(key, {
        expiresIn: 60 * 20,
      });
      imagesUrls[key] = getimage.url || getimage.ufsUrl;
    }
    // const imageBase64: Record<string, string> = {};
    // for (const key of imageKeys) {
    //   const getBase64 = await URLToBase64(imagesUrls[key]);
    //   imageBase64[key] = getBase64 ?? "";
    // }

    const mappedOrderFromQueue = getOrderFromQueue.map((item) => ({
      orderId: item.orderId,
      status: item.status,
      shippingMethod: item.shippingMethod,
      beltCode: item.beltCode,
      cageCode: item.cageCode,
      skipped: item.skipped,
      skippedAt: item.skipped ? item.skippedAt : undefined,
      shippedReason: item.shippedReason ?? undefined,
      skippedBy: item.skipped ? item.skippedByUser : undefined,
      images:
        item.images
          ?.map((image) => ({
            name: image.name,
            type: image.type,
            publicUrl: imagesUrls[image.key],
            // base64: imageBase64[image.key],
          }))
          .sort((a, b) => a.name.localeCompare(b.name)) ?? [],
      pharmacistReviews: getPharmacistReview
        .filter((review) => review.orderId === item.orderId)
        .map((review) => ({
          status: review.status,
          reason: review.status === "APPROVED" ? undefined : review.reason,
          createdAt: review.createdAt,
          reviewBy: review.reviewBy,
        })),
      logs: getLogs
        .filter((log) => log.orderId === item.orderId)
        .map((log) => ({
          action: log.action,
          description: log.description,
          createdAt: log.createdAt,
          user: log.user,
        })),
    }));

    // const getimages = mape;

    return NextResponse.json({
      status: "success",
      message: "Orders processed successfully",
      orders: mappedOrderFromQueue,
    });
  } catch (error) {
    console.error("Error processing request:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
