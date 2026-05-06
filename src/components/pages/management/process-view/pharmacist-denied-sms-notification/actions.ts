"use server";
import { db } from "@/db/db";
import { config, logs } from "@/db/schema";
import { Result } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const schemaAddPhoneNumber = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  phoneNumber: z
    .string()
    .min(12, { message: "Phone number is required" })
    .max(12, { message: "Phone number must be less than 12 characters" }),
});

export const configType = async () => "PHARMACIST_DENIED_SMS_NOTIFICATION";

export interface PharmacistDeniedSmsNotificationValue {
  name: string;
  phoneNumber: string;
}

export const AddPhoneNumberToNotification = async (
  prevState: Result | undefined,
  formData: FormData
) => {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication.user)
      return {
        status: "error",
        messages: ["User not found"],
      } as Result;

    const name = formData.get("name");
    const phoneNumber = formData.get("phoneNumber");

    const validatedFields = schemaAddPhoneNumber.safeParse({
      name,
      phoneNumber,
    });

    if (!validatedFields.success)
      return {
        status: "error",
        messages: [
          ...(validatedFields?.error?.errors.map((item) => item.message) ?? [
            "Invalid fields",
          ]),
        ],
      } as Result;

    const newPhoneNumber = {
      name: validatedFields.data.name,
      phoneNumber: validatedFields.data.phoneNumber,
    };
    const type = await configType();
    const checkList = await GetAllPhoneNumbersForSmsNotification();
    const list = (checkList.value?.list ??
      []) as PharmacistDeniedSmsNotificationValue[];

    const isPhoneNumberExists = list.find(
      (item) => item.phoneNumber === phoneNumber
    );

    if (isPhoneNumberExists !== undefined)
      return {
        status: "error",
        messages: ["Phone number already exists"],
      } as Result;

    const newList = [...list, newPhoneNumber];
    let res = undefined;
    if (checkList.value?.id !== undefined)
      res = await db
        .update(config)
        .set({
          value: newList,
          description: "Sms Notification Phone Numbers for Pharmacist Denied",
        })
        .where(and(eq(config.type, type), eq(config.id, checkList.value?.id)));
    else
      res = await db.insert(config).values({
        type: type,
        value: newList,
        description: "Sms Notification Phone Numbers for Pharmacist Denied",
      });

    try {
      const createLog = await db
        .insert(logs)
        .values({
          action: "ADD_PHARMACIST_DENIED_SMS_NOTIFICATION",
          description: `${validatedFields.data.name}'s phone number ${validatedFields.data.phoneNumber} added to the notification by ${authentication.user?.name ?? ""}`,
          userId: authentication.user?.id,
        })
        .execute();
    } catch (error) {
      console.log(error);
    }

    return {
      status: "success",
      messages: ["Phone number has been added to the notification"],
      value: {
        id: checkList.value?.id,
        description: checkList.value?.description,
        type: checkList.value?.type,
        list: newList,
      },
    } as Result;
  } catch (error) {
    return {
      status: "error",
      messages: ["Failed to add phone number to notification"],
    } as Result;
  }
};

export const deletePhoneNumberFromNotification = async (
  phoneNumber: string
) => {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication.user)
      return {
        status: "error",
        messages: ["User not found"],
      } as Result;

    const type = await configType();
    const checkList = await GetAllPhoneNumbersForSmsNotification();
    const list = (checkList.value?.list ??
      []) as PharmacistDeniedSmsNotificationValue[];

    const newList = list.filter((item) => item.phoneNumber !== phoneNumber);

    let res = undefined;
    if (list.length !== undefined)
      res = await db
        .update(config)
        .set({
          value: newList,
          description: "Sms Notification Phone Numbers for Pharmacist Denied",
        })
        .where(eq(config.type, type));
    else
      res = await db.insert(config).values({
        type: type,
        value: newList,
        description: "Sms Notification Phone Numbers for Pharmacist Denied",
      });

    try {
      const createLog = await db
        .insert(logs)
        .values({
          action: "DELETE_PHARMACIST_DENIED_SMS_NOTIFICATION",
          description: `phone number ${phoneNumber} removed from the notification by ${authentication.user?.name ?? ""}`,
          userId: authentication.user?.id,
        })
        .execute();
    } catch (error) {
      console.log(error);
    }

    return {
      status: "success",
      messages: ["Phone number has been removed from the notification"],
      value: {
        id: checkList.value?.id,
        description: checkList.value?.description,
        type: checkList.value?.type,
        list: newList,
      },
    } as Result;
  } catch (error) {
    return {
      status: "error",
      messages: ["Failed to remove phone number from notification"],
    } as Result;
  }
};

export const GetAllPhoneNumbersForSmsNotification = async () => {
  try {
    const type = await configType();
    const list = await db.query.config.findFirst({
      where: eq(config.type, type),
    });
    return {
      status: "success",
      messages: ["Phone numbers fetched successfully"],
      value: {
        id: list?.id,
        description: list?.description,
        type: list?.type,
        list: (list?.value ?? []) as PharmacistDeniedSmsNotificationValue[],
      },
    } as Result;
  } catch (error) {
    return {
      status: "error",
      messages: ["Failed to fetch phone numbers"],
    } as Result;
  }
};
