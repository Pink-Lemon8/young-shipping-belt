"use server";

import { getOrderDetail, getPatientDetail } from "../pharmacyWR/pharmacywire";
import { Result } from "@/lib/types";
import "dotenv/config";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getOrderDetailsFromPw(
  orderId: string,
  patientId: string,
) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (authentication?.user === undefined) {
      return {
        status: "error",
        messages: ["User not logged in. Please contact support."],
      } as Result;
    }

    const pwUsername = process.env.UNIVERSAL_PW_LOGIN ?? "";
    const pwPassword = process.env.UNIVERSAL_PW_PASS ?? "";

    const getOrderDetails = await getOrderDetail(
      orderId,
      true,
      pwUsername,
      pwPassword,
    );

    if (getOrderDetails.transaction.status._text !== "success") {
      console.log("PW - Error -> ", getOrderDetails);
      return {
        status: "error",
        messages: [getOrderDetails.transaction.messages.message._cdata],
        value: { orderId: orderId, patientId: patientId },
      } as Result;
    }

    const getPatientDetails = await getPatientDetail(
      patientId,
      true,
      pwUsername,
      pwPassword,
    );

    // TODO: Uncomment this when PharmacyWire is fixed
    // if (getPatientDetails.transaction.status._text !== "success")
    //   return {
    //     status: "error",
    //     messages: [getPatientDetails.transaction.messages.message._cdata],
    //   } as Result;

    const patient = getPatientDetails?.transaction?.["pw:patient"] ?? undefined;
    const orderFromPW =
      getOrderDetails.transaction["momex:orders"]["momex:order"];
    const patientFirstName = patient?.["momex:firstname"]?._cdata ?? "";
    const patientLastName = patient?.["momex:lastname"]?._cdata ?? "";
    const fullName = `${patientFirstName ?? ""} ${patientLastName ?? ""}`;
    const lastValidation = orderFromPW?.["momex:last_validation"];

    const billingAddress = orderFromPW?.["momex:billing"];
    const shippingAddress = orderFromPW?.["momex:shipping"];

    const pwItems =
      orderFromPW?.["momex:items"]["momex:item"].length !== undefined
        ? orderFromPW?.["momex:items"]["momex:item"]
        : [orderFromPW?.["momex:items"]["momex:item"]];

    const items = pwItems
      .map((item: any) => {
        const id: String = item?._attributes?.["momex:part-id"];
        if (id === undefined || !id.toUpperCase().includes("DP"))
          return undefined;
        return {
          orderId: orderId,
          packageId: id,
          description: item["momex:description"]?._cdata,
          quantity: parseInt(item["momex:quantity"]?._text || "0"),
          unitPrice: item["momex:unitprice"]?._text,
        };
      })
      .filter((item: any) => item !== undefined)
      .reduce((acc: any[], curr: any) => {
        const existing = acc.find((item) => item.packageId === curr.packageId);
        if (existing) {
          existing.quantity += parseInt(curr.quantity);
          return acc;
        }
        return [...acc, curr];
      }, []);

    // Extract monograph URL from paperworks
    const paperworks = orderFromPW?.["momex:paperworks"]?.["momex:paperwork"];
    const paperworksArray = Array.isArray(paperworks)
      ? paperworks
      : paperworks
        ? [paperworks]
        : [];
    const monographPaperwork = paperworksArray.find(
      (p: any) => p._attributes?.["momex:type"] === "Drug/Monograph",
    );
    const monographUrl =
      monographPaperwork?.["momex:paperwork-url"]?._cdata ?? undefined;

    const orderWithItems = {
      orderId: orderId,
      patientId: patientId,
      patientName: fullName,
      patient: patient,
      status: orderFromPW?.["momex:status"]._text,
      trackingNumber: orderFromPW?.["momex:trackingid"]._text ?? undefined,
      billingAddress: billingAddress,
      shippingAddress: shippingAddress,
      items: items,
      createdAt: orderFromPW?.["momex:created"]?._text,
      monographUrl: monographUrl,
    };

    return {
      status: "success",
      value: orderWithItems,
    } as Result;
  } catch (error) {
    console.log("PW - Error -> ", error);
    return undefined;
  }
}

export async function getOrderDetailsFromLym(order: any) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });
    if (authentication?.user === undefined) {
      return {
        status: "error",
        messages: ["User not logged in. Please contact support."],
      } as Result;
    }
    const orderIdForLym = order.orderId.toLowerCase().replaceAll("lym-", "");

    const fetchOrder = await fetch(
      `https://lymlight.com/api/shipping-app/order?id=${orderIdForLym}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LYMLIGHT_API_AUTH}`,
        },
      },
    );

    if (!fetchOrder.ok) {
      console.log("Lymlight - Error -> ", fetchOrder);
      console.log(
        "Lymlight - Error Response Body -> ",
        await fetchOrder.text(),
      );
      return {
        status: "error",
        messages: [
          `Order (${order.orderId}) not found in Lymlight system. Please contact support.`,
        ],
        value: { orderId: order.orderId, patientId: order.patientId },
      } as Result;
    }

    const orderFromLym = await fetchOrder.text();
    const dataJson = JSON.parse(orderFromLym);
    const orderFromLymJson = dataJson?.data;
    const orderStatus = orderFromLymJson?.order?.status ?? "Ready_To_Ship";

    const orderTotal = orderFromLymJson?.order?.total ?? "0";
    const shippingCost = orderFromLymJson?.order?.shippingFee ?? "0";
    const trackingNumber = orderFromLymJson?.order?.trackingNumber ?? "";

    const areaCode = orderFromLymJson.patient.primaryPhoneNumber.substring(
      orderFromLymJson.patient.primaryPhoneNumber?.indexOf("(") + 1,
      orderFromLymJson.patient.primaryPhoneNumber?.indexOf(")"),
    );

    const patient = {
      "momex:firstname": { _cdata: orderFromLymJson.patient.firstName },
      "momex:lastname": { _cdata: orderFromLymJson.patient.lastName },
      "momex:email": { _cdata: orderFromLymJson.patient.email },
      "momex:areacode": { _text: areaCode },
      "momex:phone": { _text: orderFromLymJson.patient.primaryPhoneNumber },
    };

    const billingAddressLym = orderFromLymJson.addresses.find(
      (address: any) => address.type === "Billing",
    );
    const shippingAddressLym = orderFromLymJson.addresses.find(
      (address: any) => address.type === "Shipping",
    );

    const billingAddress = {
      "momex:address": { _cdata: billingAddressLym.street },
      "momex:address2": { _cdata: billingAddressLym.street2 },
      "momex:address3": { _cdata: billingAddressLym.street3 },
      "momex:city": { _cdata: billingAddressLym.city },
      "momex:state": { _cdata: billingAddressLym.province },
      "momex:country": { _cdata: billingAddressLym.country },
      "momex:postalcode": { _cdata: billingAddressLym.postalCode },
      "momex:firstname": { _cdata: patient["momex:firstname"]._cdata },
      "momex:lastname": { _cdata: patient["momex:lastname"]._cdata },
    };
    const shippingAddress = {
      "momex:address": { _cdata: shippingAddressLym.street },
      "momex:address2": { _cdata: shippingAddressLym.street2 },
      "momex:address3": { _cdata: shippingAddressLym.street3 },
      "momex:city": { _cdata: shippingAddressLym.city },
      "momex:state": { _cdata: shippingAddressLym.province },
      "momex:country": { _cdata: shippingAddressLym.country },
      "momex:postalcode": { _cdata: shippingAddressLym.postalCode },
      "momex:firstname": { _cdata: patient["momex:firstname"]._cdata },
      "momex:lastname": { _cdata: patient["momex:lastname"]._cdata },
    };

    const patientFirstName = patient["momex:firstname"]._cdata;
    const patientLastName = patient["momex:lastname"]._cdata;
    const fullName = `${patientFirstName} ${patientLastName}`;

    const items = orderFromLymJson.items
      .map((item: any) => {
        const id: String = item.item.packageId;
        if (id === undefined) return undefined;
        // Extract legacyId (e.g., "DP-16946") - this maps to our packages table
        const legacyId = item.package?.legacyId ?? undefined;
        return {
          orderId: order.orderId,
          packageId: "PP-" + id,
          legacyId: legacyId, // Used for monograph lookup
          din: item.package?.din ?? undefined,
          description:
            item.product.name +
            (item.package.nameSuffix ? " " + item.package.nameSuffix : "") +
            " " +
            " (" +
            item.package.strength +
            ")" +
            " (" +
            Number(item.package.packageSize).toFixed(0) +
            " " +
            item.package.unit +
            " qty)",
          quantity: item.item.quantity,
          unitPrice: item.item.unitPrice,
        };
      })
      .filter((item: any) => item !== undefined);

    const orderWithItems = {
      createdAt: new Date().toISOString(),
      status: orderStatus,
      patientName: fullName,
      shippingCost: shippingCost,
      trackingNumber: trackingNumber,
      total: orderTotal,
      lastValidatedAt: new Date().toISOString(),
      billingAddress: billingAddress,
      shippingAddress: shippingAddress,
      items: items,
      packages: [],
      isColdChain: true,
      patient: patient,
      organization: orderFromLymJson.organization,
    };
    return {
      status: "success",
      value: orderWithItems,
    } as Result;
  } catch (error) {
    console.log("Lymlight - Error -> ", error);
    return undefined;
  }
}
