"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dispatch, SetStateAction, use, useEffect, useState } from "react";
import { Result } from "@/lib/types";
import { getFiles } from "./get";
import { Loader2 } from "lucide-react";

export function FileModel({
  file,
  setFile,
  isPublic = false,
  open = false,
  setOpen = undefined,
}: {
  file?: any;
  setFile: Dispatch<SetStateAction<any | undefined>>;
  isPublic?: boolean;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}) {
  const [result, setResult] = useState<Result | undefined>(undefined);
  const [preview, setPreview] = useState<any | undefined>(undefined);

  useEffect(() => {
    const fetchFiles = async () => {
      if (isPublic) {
        setResult({
          status: "success",
          value: [file],
        });
      } else {
        const result = await getFiles([file?.key]);
        setResult(result);
      }
    };
    if (file !== undefined) fetchFiles();
  }, [file]);

  useEffect(() => {
    if (!open) {
      setResult(undefined);
      setFile(undefined);
      setPreview(undefined);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={"sm:max-w-[75vw]"}>
        <DialogHeader>
          <DialogTitle>{file?.name}</DialogTitle>
        </DialogHeader>
        {result?.value
          ?.filter((file: any) => file !== null && file !== undefined)
          .map((file: any, index: any) => (
            <div key={index}>
              {result !== undefined ? (
                <iframe
                  src={result?.value?.find((f: any) => f.key === file.key)?.url}
                  className="w-full h-[60vh] rounded-md shadow-sm"
                />
              ) : (
                <div className="w-full h-[60vh] flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>
          ))}
        {result === undefined && (
          <div className="w-full h-[60vh] flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
