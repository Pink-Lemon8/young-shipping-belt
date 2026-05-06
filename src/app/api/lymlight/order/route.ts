import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import {
  affiliates,
  beltQueues,
  orderExpectedItems,
  packages,
  logs,
  boxSizes,
} from "@/db/schema";
import { eq, and, sql, or } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

const LYMLIGHT_AUTH_TOKEN =
  process.env.LYMLIGHT_AUTH_TOKEN || "uJa3nxM0obYpjZTds4VUWKLhM6dJEHlS";
const LYMLIGHT_API_BASE =
  process.env.LYMLIGHT_API_BASE || "https://lymlight.com/api/belt/order";

interface LymlightOrder {
  order: {
    id: number;
    organizationId: string;
    patientId: number;
    prescriptionId: string;
    status: string;
    paymentMethod: string;
    subTotal: string;
    shippingFee: string;
    total: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    patient: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      homePhoneNumber: string;
      mobilePhoneNumber: string;
    };
    organization: {
      id: string;
      name: string;
      shortName: string;
    };
    addresses: Array<{
      orderId: number;
      name: string | null;
      street: string;
      streetTwo: string | null;
      streetThree: string | null;
      city: string;
      province: string;
      country: string;
      postalCode: string;
      phoneNumber: string | null;
      faxNumber: string | null;
      type: string;
      isDefault: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
    items: Array<{
      packageId: number;
      quantity: number;
      unitPrice: string;
      package: {
        id: number;
        productId: number;
        imageId: string | null;
        nameSuffix: string | null;
        strength: string;
        form: string;
        daySupply: number;
        dosageSig: string | null;
        manufacturerName: string;
        productCountry: string;
        shippingCountry: string;
        din: string;
        ndc: string;
        packageSize: string;
        unit: string;
        primaryPrice: string;
        costPrice: string;
        minOrderQuantity: number;
        maxOrderQuantity: number;
        comments: string | null;
        status: string;
        stability: string | null;
        stabilityUnit: string;
        createdAt: string;
        updatedAt: string;
        legacyId: string | null;
        product: {
          id: number;
          name: string;
          ingredient: string;
          schedule: string;
          coldChain: boolean;
          category: string;
          genericOf: any;
          comments: string | null;
          status: string;
          createdAt: string;
          updatedAt: string;
          primaryPrice: string | null;
          costPrice: string | null;
        };
      };
    }>;
  };
  label: {
    id: number;
    deliveryServiceCredentialId: number;
    shippingMethod: string;
    orderId: number;
    transactionId: string;
    trackingNumber: string;
    costPrice: string | null;
    status: string;
    box: {
      id: number;
      name: string;
      width: string;
      height: string;
      length: string;
      weight: string;
      weightUnit: string;
      description: string;
      isColdChain: boolean;
      dimensionUnit: string;
    };
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    deliveryService: {
      id: number;
      type: string;
      accountNumber: string;
      clientId: string;
      description: string;
    };
    files: Array<{
      labelFileType: string;
      name: string;
      size: number;
      type: string;
      base64: string;
    }>;
  };
}

async function fetchLymlightOrder(
  orderId: string,
  authToken: string,
): Promise<LymlightOrder> {
  const response = await fetch(
    `${LYMLIGHT_API_BASE}?AUTH=${authToken}&orderId=${orderId}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch order from Lymlight: ${response.statusText}`,
    );
  }

  return await response.json();
}

async function uploadBase64File(
  base64: string,
  filename: string,
  type: string,
) {
  try {
    const buffer = Buffer.from(base64, "base64");
    const blob = new Blob([buffer], { type });
    const file = new File([blob], filename, { type });

    const uploadResult = await utapi.uploadFiles(file);

    if (uploadResult.error) {
      throw new Error(`Failed to upload file: ${uploadResult.error.message}`);
    }

    return {
      url: uploadResult.data.url,
      key: uploadResult.data.key,
      name: filename,
      type: type,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

function mapShippingMethod(
  lymlightMethod: string,
): "FEDEX" | "CANADA_POST" | "UPS" | "DEFAULT" {
  const methodMap: Record<string, "FEDEX" | "CANADA_POST" | "UPS" | "DEFAULT"> =
  {
    Canada_Post: "CANADA_POST",
    FedEx: "FEDEX",
    UPS: "UPS",
  };

  return methodMap[lymlightMethod] || "DEFAULT";
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, auth } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const authToken = auth || LYMLIGHT_AUTH_TOKEN;

    const lymlightData = await fetchLymlightOrder(orderId, authToken);

    const { order, label } = lymlightData;

    const shippingAddress = order.addresses.find(
      (addr) => addr.type === "Shipping",
    );
    if (!shippingAddress) {
      return NextResponse.json(
        { error: "No shipping address found" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      let affiliate = await tx
        .select()
        .from(affiliates)
        .where(eq(affiliates.name, order.organization.name))
        .limit(1);

      if (!affiliate || affiliate.length === 0) {
        const [newAffiliate] = await tx.insert(affiliates).values({
          name: order.organization.name,
          code: order.organization.shortName,
          pwLocal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        affiliate = await tx
          .select()
          .from(affiliates)
          .where(eq(affiliates.id, newAffiliate.insertId))
          .limit(1);
      }

      const affiliateId = affiliate[0].id;

      // Handle box size from Lymlight - use the actual box ID!
      let boxSizeId = null;
      if (label.box && label.box.id) {
        // Directly use the box ID from Lymlight since it matches our database
        boxSizeId = label.box.id;

        // Optionally verify the box exists in our database
        const boxExists = await tx
          .select()
          .from(boxSizes)
          .where(eq(boxSizes.id, label.box.id))
          .limit(1);

        if (!boxExists || boxExists.length === 0) {
          console.warn(
            `Box size ID ${label.box.id} from Lymlight not found in database`,
          );
          // You could create it here if needed, but ideally box sizes should be synced
        }
      }

      const uploadedFiles = [];
      for (const file of label.files) {
        try {
          const uploaded = await uploadBase64File(
            file.base64,
            file.name,
            file.type,
          );
          uploadedFiles.push({
            ...uploaded,
            labelType: file.labelFileType,
          });
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      const labelFile = uploadedFiles.find((f) => f.labelType === "Label");
      const commercialInvoiceFile = uploadedFiles.find(
        (f) => f.labelType === "Commercial_Invoice",
      );

      const lymlightOrderId = `LYM-${order.id}`;

      const existingQueue = await tx
        .select()
        .from(beltQueues)
        .where(eq(beltQueues.orderId, lymlightOrderId))
        .limit(1);

      if (existingQueue && existingQueue.length > 0) {
        return {
          success: false,
          message: "Order already exists in queue",
          orderId: lymlightOrderId,
        };
      }

      const batchId = parseInt(
        new Date().toISOString().slice(0, 10).replace(/-/g, ""),
      );

      // Always use belt code "C" for Lymlight orders
      const beltCode = "C";

      const [queueEntry] = await tx.insert(beltQueues).values({
        orderId: lymlightOrderId,
        fullOrderId: lymlightOrderId,
        patientId: order.patientId.toString(),
        patientName: `${order.patient.firstName} ${order.patient.lastName}`,
        affiliateId: affiliateId,
        batchId: batchId,
        beltCode: beltCode,
        boxSizeId: boxSizeId,
        shippingMethod: mapShippingMethod(label.shippingMethod),
        trackingNumber: label.trackingNumber,
        transactionId: label.transactionId,
        status: "SENT_TO_BELT",
        label: labelFile
          ? [
            {
              url: labelFile.url,
              key: labelFile.key,
              name: labelFile.name,
            },
          ]
          : [],
        files: uploadedFiles,
        extraFiles: order.addresses ? order.addresses : [], // Store addresses in extraFiles field
        labelCreatedAt: new Date(label.createdAt),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      for (const item of order.items) {
        const packageMapping = await tx
          .select()
          .from(packages)
          .where(
            or(
              eq(packages.lymlightPackageId, item.packageId),
              eq(
                packages.id,
                parseInt(
                  item.package?.legacyId?.toUpperCase()?.replace(/^DP-/, "") ??
                  "-1",
                ),
              ),
            ),
          )
          .limit(1);

        if (!packageMapping || packageMapping.length === 0) {
          console.warn(
            `No package mapping found for Lymlight package ID: ${item.packageId}`,
          );
          continue;
        }

        const internalPackageId = `DP-${packageMapping[0].id}`;

        await tx.insert(orderExpectedItems).values({
          orderId: lymlightOrderId,
          packageId: internalPackageId,
          legacyId: item.package?.legacyId ?? undefined,
          description: `${item.package.product.name}${item.package.nameSuffix ? " " + item.package.nameSuffix : ""} ${item.package.strength} ${item.package.form}`,
          din: item.package.din ?? undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await tx.insert(logs).values({
        action: "LYMLIGHT_ORDER_IMPORT",
        description: `Imported Lymlight order ${order.id} as ${lymlightOrderId}`,
        orderId: lymlightOrderId,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: "Order successfully imported",
        orderId: lymlightOrderId,
        trackingNumber: label.trackingNumber,
        affiliateId: affiliateId,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing Lymlight order:", error);
    return NextResponse.json(
      {
        error: "Failed to process order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get("orderId");
  const auth = searchParams.get("AUTH");

  if (!orderId) {
    return NextResponse.json(
      { error: "Order ID is required" },
      { status: 400 },
    );
  }

  const authToken = auth || LYMLIGHT_AUTH_TOKEN;

  try {
    const lymlightData = await fetchLymlightOrder(orderId, authToken);

    const lymlightOrderId = `LYM-${lymlightData.order.id}`;

    const existingQueue = await db
      .select()
      .from(beltQueues)
      .where(eq(beltQueues.orderId, lymlightOrderId))
      .limit(1);

    if (existingQueue && existingQueue.length > 0) {
      return NextResponse.json({
        exists: true,
        orderId: lymlightOrderId,
        status: existingQueue[0].status,
        message: "Order already exists in queue",
      });
    }

    return NextResponse.json({
      exists: false,
      message: "Order not found in queue. Use POST to import.",
      lymlightOrder: {
        id: lymlightData.order.id,
        patient: `${lymlightData.order.patient.firstName} ${lymlightData.order.patient.lastName}`,
        organization: lymlightData.order.organization.name,
        trackingNumber: lymlightData.label.trackingNumber,
      },
    });
  } catch (error) {
    console.error("Error checking Lymlight order:", error);
    return NextResponse.json(
      {
        error: "Failed to check order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
