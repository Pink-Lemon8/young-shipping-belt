"use server";

import { db } from "@/db/db";
import { files } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Result } from "@/lib/types";
import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

const utapi = new UTApi();

export async function getFilesByIDs(ids: number[]) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user) {
      return {
        status: "error",
        errors: [{ code: "UNAUTHORIZED", message: "You are not authorized" }],
      } as Result;
    }

    const filesData = await db
      .select()
      .from(files)
      .where(inArray(files.id, ids));
    const publicFiles = filesData
      ?.filter((file) => file.isPublic)
      ?.map((file) => {
        return {
          id: file.id,
          customId: file.customId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url,
        };
      });

    const privateFiles = filesData.filter((file) => !file.isPublic);

    const getSignedURL = await Promise.all(
      privateFiles.map(async (file) => {
        const signedURL = await utapi.getSignedURL(file.key);
        return {
          id: file.id,
          customId: file.customId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: signedURL?.ufsUrl,
        };
      })
    );

    const mergedFiles = [...publicFiles, ...getSignedURL];

    if (mergedFiles.length === 0)
      return {
        status: "error",
        messages: ["No files found"],
        errors: [
          {
            code: "NO_FILES_FOUND",
            message: "No files found",
          },
        ],
      } as Result;

    return {
      status: "success",
      value: mergedFiles,
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["Failed to get files"],
      errors: [
        {
          code: "FAILED_TO_GET_FILES",
          message: "Failed to get files",
        },
      ],
    } as Result;
  }
}

export async function getFilesByKeys(keys: string[]) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user) {
      return {
        status: "error",
        errors: [{ code: "UNAUTHORIZED", message: "You are not authorized" }],
      } as Result;
    }

    const file = await Promise.all(
      keys.map(async (key: string) => {
        const filesData = await utapi.getSignedURL(key);
        return {
          key,
          url: filesData?.url,
        };
      })
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

const uploadFileValidation = z.object({
  customId: z.string({ message: "Custom id is text" }).nullable().optional(),
  customName: z
    .string({ message: "Custom name is text with file format (example.png)" })
    .nullable()
    .optional(),
  file: z.instanceof(File),
  description: z
    .string({ message: "Description is text" })
    .nullable()
    .optional(),
  isPublic: z
    .boolean({ message: "Is public is required as boolean" })
    .default(false),
});

export async function uploadFile(prev: Result | undefined, formData: FormData) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user) {
      return {
        status: "error",
        errors: [{ code: "UNAUTHORIZED", message: "You are not authorized" }],
      } as Result;
    }

    const validation = uploadFileValidation.safeParse({
      ...Object.fromEntries(formData),
      isPublic:
        formData.get("isPublic") !== undefined
          ? (formData.get("isPublic") as string)?.toLowerCase() === "true" ||
            (formData.get("isPublic") as string) === "1"
          : false,
    });

    if (!validation.success)
      return {
        status: "error",
        timestamp: new Date(),
        messages: ["Invalid form data"],
        errors: validation.error.issues.map((error) => {
          return {
            field: error.path[0],
            code: error.path.join(","),
            message: error.message,
          };
        }),
      } as Result;

    const result = await utapi.uploadFiles(
      [
        new File(
          [validation.data.file],
          validation.data.customName
            ? validation.data.customName
            : validation.data.file.name,
          {
            type: validation.data.file.type,
            lastModified: validation.data.file.lastModified,
          }
        ),
      ],
      {
        acl: validation.data.isPublic ? "public-read" : "private",
      }
    );

    if (result.length === 0 || result[0].error)
      return {
        status: "error",
        messages: ["Failed to upload file"],
        errors: result[0].error
          ? [
              {
                code: result[0].error.code,
                message: result[0].error.message,
              },
            ]
          : undefined,
      } as Result;

    const data = result[0].data;

    const [fileToDB] = await db.insert(files).values({
      customId: validation.data.customId,
      description: validation.data.description,
      isPublic: validation.data.isPublic,
      url: data.ufsUrl,
      key: data.key,
      name: data.name,
      type: data.type,
      size: data.size,
      hash: data.fileHash,
    });

    if (!fileToDB.insertId)
      return {
        status: "error",
        messages: ["Failed to add file to database"],
        errors: [
          {
            code: "UPLOAD_ERROR",
            message: "Failed to add file to database",
          },
        ],
      } as Result;

    return {
      status: "success",
      value: {
        id: fileToDB.insertId,
        customId: validation.data.customId,
        description: validation.data.description,
        isPublic: validation.data.isPublic,
        url: data.ufsUrl,
        key: data.key,
        name: validation.data.customName || data.name,
        type: data.type,
        size: data.size,
        uploadedBy: authentication.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["Failed to upload file"],
    } as Result;
  }
}

export async function deleteFileByID(id: number) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user) {
      return {
        status: "error",
        errors: [{ code: "UNAUTHORIZED", message: "You are not authorized" }],
      } as Result;
    }

    const [deleteFileInfo] = await db
      .select()
      .from(files)
      .where(eq(files.id, id));

    if (deleteFileInfo === undefined)
      return {
        status: "error",
        messages: ["File not found"],
      } as Result;

    const result = await utapi.deleteFiles([deleteFileInfo.key]);

    if (result.success === false)
      return {
        status: "error",
        messages: ["Failed to delete file from UploadThing"],
        errors: [
          {
            code: "DELETE_FILE_ERROR",
            message: "Failed to delete file from UploadThing",
          },
        ],
      } as Result;

    const [deleteFile] = await db.delete(files).where(eq(files.id, id));

    if (deleteFile.affectedRows === 0)
      return {
        status: "error",
        messages: ["Failed to delete file from database"],
        errors: [
          {
            code: "DELETE_FILE_ERROR",
            message: "Failed to delete file from database",
          },
        ],
      } as Result;

    return {
      status: "success",
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["Failed to delete file"],
    } as Result;
  }
}

export async function deleteFileByKey(key: string) {
  try {
    const authentication = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authentication?.user) {
      return {
        status: "error",
        errors: [{ code: "UNAUTHORIZED", message: "You are not authorized" }],
      } as Result;
    }
    const [deleteFileInfo] = await db
      .select()
      .from(files)
      .where(eq(files.key, key));

    if (deleteFileInfo === undefined)
      return {
        status: "error",
        messages: ["File not found"],
      } as Result;

    const result = await utapi.deleteFiles([deleteFileInfo.key]);

    if (result.success === false)
      return {
        status: "error",
        messages: ["Failed to delete file from UploadThing"],
        errors: [
          {
            code: "DELETE_FILE_ERROR",
            message: "Failed to delete file from UploadThing",
          },
        ],
      } as Result;

    const [deleteFile] = await db.delete(files).where(eq(files.key, key));

    if (deleteFile.affectedRows === 0)
      return {
        status: "error",
        messages: ["Failed to delete file from database"],
        errors: [
          {
            code: "DELETE_FILE_ERROR",
            message: "Failed to delete file from database",
          },
        ],
      } as Result;

    return {
      status: "success",
    } as Result;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      messages: ["Failed to delete file"],
    } as Result;
  }
}
