"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { uploadFile } from "../actions";
import { Result } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FileUploadFormProps = {
  isPublic?: boolean;
  customId?: string;
  customName?: string;
  description?: string;
  setResult?: React.Dispatch<React.SetStateAction<any>>;
};

export function FileUploadForm({
  isPublic = false,
  customId = undefined,
  customName = undefined,
  description = undefined,
  setResult = undefined,
}: FileUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction, isPending] = useActionState<
    Result | undefined,
    FormData
  >(uploadFile, undefined);

  useEffect(() => {
    setResult?.(result);
  }, [result]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    formData.append("isPublic", isPublic.toString());
    if (customId) formData.append("customId", customId);
    if (customName) formData.append("customName", customName);
    if (description) formData.append("description", description);

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 p-1">
        <div className="space-y-1">
          <Label htmlFor="file">File *</Label>
          <Input
            id="file"
            name="file"
            type="file"
            required
            className={cn(
              result?.status === "error" &&
                result.errors?.find((error) => error.field === "file") &&
                "border-red-500 focus-visible:ring-red-500 ring-red-500"
            )}
            placeholder="e.g. Main Storage"
          />
        </div>
      </div>

      {result?.status === "success" && (
        <div className="w-full flex flex-col gap-2">
          {result.messages?.map((message, index) => (
            <p key={index} className="text-sm font-medium text-green-500">
              {message}
            </p>
          ))}
        </div>
      )}

      {result?.status === "error" && (
        <div className="w-full flex flex-col gap-2">
          {result.errors?.map((error, index) => (
            <p key={index} className="text-sm font-medium text-red-500">
              {error.message}
            </p>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          className="w-32 cursor-pointer"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
            </>
          ) : (
            "Upload File"
          )}
        </Button>
      </div>
    </form>
  );
}
