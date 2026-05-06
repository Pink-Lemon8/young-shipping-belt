"use server";

import { Result } from "@/lib/types";
import { UTApi } from "uploadthing/server";
import { getUserById } from "@/server/controller/users";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const utapi = new UTApi();

export async function getFiles(
  keys: string[],
  expiresIn: number = 60 * 5,
  authenticatedUserId?: string // Pass from already-authenticated context to skip redundant auth
) {
  try {
    // If userId provided, skip auth check (caller already verified)
    // Otherwise, do auth check for backward compatibility
    if (!authenticatedUserId) {
      const authentication = await auth.api.getSession({
        headers: await headers(),
      });
      if (!authentication?.user) {
        return {
          status: "error",
          messages: ["User not found"],
        } as Result;
      }
      const beltUser = await getUserById(authentication?.user?.id ?? "-1");
      if (!beltUser) {
        return {
          status: "error",
          messages: ["User not found"],
        } as Result;
      }
    }

    const file = await Promise.all(
      keys
        .map(async (key: string) => {
          try {
            const filesData = await utapi.getSignedURL(key, { expiresIn });
            return {
              key,
              url: filesData?.url || filesData?.ufsUrl,
            };
          } catch (error) {
            console.error(error);
            return {
              key,
              url: "/images/error-image.jpg",
            };
          }
        })
        .filter((file) => file !== undefined && file !== null)
    );
    return {
      status: "success",
      value: file,
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["Failed to get files"],
    } as Result;
  }
}
