"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadExtraFileForm } from "./form";
import { Dispatch, SetStateAction, use, useEffect, useState } from "react";
import { Result } from "@/lib/types";
import { Plus } from "lucide-react";

type UploadExtraFileDialogProps = {
  orderId?: string;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
};

export function UploadExtraFileDialog({
  orderId,
  open = false,
  setOpen = undefined,
}: UploadExtraFileDialogProps) {
  const [result, setResult] = useState<Result | undefined>(undefined);

  useEffect(() => {
    if (result?.status === "success") {
      setOpen?.(false);
    }
  }, [result]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Extra File</DialogTitle>
          <DialogDescription>Upload a new extra file.</DialogDescription>
        </DialogHeader>
        <UploadExtraFileForm setResult={setResult} orderId={orderId} />
      </DialogContent>
    </Dialog>
  );
}
