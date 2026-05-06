"use server";

import { Result } from "@/lib/types";
import { getAllCagesLength } from "@/server/controller/queues";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAllCagesLengthAction(): Promise<Result> {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication || !authentication.user) {
      return {
        status: "error",
        messages: ["You are not authorized to pull queue"],
      } as Result;
    }

    const cagesLength = await getAllCagesLength();

    return {
      status: "success",
      value: cagesLength,
    };
  } catch (error) {
    return {
      status: "error",
      messages: ["Failed to pull queue"],
    } as Result;
  }
}
