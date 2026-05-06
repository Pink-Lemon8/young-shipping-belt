"use server";
import { Result } from "@/lib/types";
import { z } from "zod";
import { Error } from "@/lib/types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { deleteFileByID, uploadFile } from "@/components/entity/file/actions";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema";
import { db } from "@/db/db";

const editProfileSchema = z.object({
  image: z.instanceof(File).optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name must be less than 150 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phoneNumber: z
    .string()
    .max(18, "Phone number must be less than 18 characters")
    .optional(),
  language: z
    .string()
    .min(5, "Language is required")
    .max(6, "Language must be less than 6 characters")
    .optional(),
  timezone: z.string().min(1, "Timezone is required").optional(),
  bio: z.string().max(255, "Bio must be less than 255 characters").optional(),
});

export async function edit(prevState: Result | undefined, formData: FormData) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user)
      return {
        status: "error",
        errors: [
          {
            code: "unauthorized",
            message: "You are not authorized",
          },
        ],
      } as Result;

    const validation = editProfileSchema.safeParse(
      Object.fromEntries(formData)
    );

    if (!validation.success) {
      const errors = validation.error.errors.map((error) => {
        return {
          code: error.code,
          field: error.path[0],
          message: error.message,
        } as Error;
      });
      return {
        status: "error",
        errors: errors,
      } as Result;
    }

    // Additional file size validation
    if (validation.data.image && validation.data.image.size > 0) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (validation.data.image.size > maxSize) {
        return {
          status: "error",
          messages: [
            "File size too large. Please select an image smaller than 5MB.",
          ],
          errors: [
            {
              code: "file_too_large",
              field: "image",
              message: "File size exceeds maximum limit of 5MB",
            },
          ],
        } as Result;
      }

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(validation.data.image.type)) {
        return {
          status: "error",
          messages: ["Invalid file type. Please select a JPEG or PNG image."],
          errors: [
            { code: "invalid_file_type", message: "File type not allowed" },
          ],
        } as Result;
      }
    }

    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, authentication.user.id))
      .limit(1);

    if (!currentUser) {
      return {
        status: "error",
        errors: [{ code: "not_found", message: "User not found" }],
      } as Result;
    }

    const phoneNumber = validation.data.phoneNumber
      ? validation.data.phoneNumber.replaceAll("N/A", "").trim().length >= 14
        ? validation.data.phoneNumber
        : null
      : null;

    const bio = validation.data.bio
      ? validation.data.bio.trim().length > 0
        ? validation.data.bio
        : null
      : null;

    let imageId: string | null = null;
    if (validation.data.image && validation.data.image.size > 0) {
      const formData = new FormData();
      formData.append("file", validation.data.image);
      const fileExtension = validation.data.image.name.split(".")[1] || "jpeg";
      formData.append(
        "customName",
        `profile-image-${authentication.user.id}.${fileExtension}`
      );
      formData.append("isPublic", "true");
      const imageResult = await uploadFile(undefined, formData);

      if (imageResult.status === "success") {
        if (currentUser.image !== null) {
          const deleteImageResult = await deleteFileByID(
            Number(currentUser.image)
          );
          if (deleteImageResult.status === "success") {
            imageId = imageResult.value?.id.toString();
          } else {
            await deleteFileByID(Number(imageResult.value?.id));
            imageId = currentUser.image;
          }
        } else imageId = imageResult.value?.id.toString();
      }
    }

    if (
      currentUser.image !== null &&
      validation.data.image &&
      validation.data.image.size === 0
    ) {
      const imageResult = await deleteFileByID(Number(currentUser.image));
      if (imageResult.status === "success") {
        imageId = null;
      }
    }

    if (imageId === null)
      await db
        .update(user)
        .set({ image: null })
        .where(eq(user.id, authentication.user.id));

    const updateProfile = await auth.api.updateUser({
      headers: await headers(),
      body: {
        name: validation.data.name,
        phoneNumber: phoneNumber,
        language: validation.data.language,
        timezone: validation.data.timezone,
        bio: bio,
        image: imageId ?? undefined,
      },
    });

    if (updateProfile && updateProfile?.status === false)
      return {
        status: "error",
        messages: ["Failed to update profile"],
      } as Result;

    return {
      status: "success",
      messages: ["Profile updated successfully"],
    } as Result;
  } catch (error) {
    return {
      status: "error",
      messages: ["Failed to update profile"],
    } as Result;
  }
}
