"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadStageImageForm } from "./form";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Result } from "@/lib/types";

type UploadStageImageDialogProps = {
  orderId?: string;
  defaultStage?: "1" | "2" | "3";
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
};

export function UploadStageImageDialog({
  orderId,
  defaultStage = "1",
  open = false,
  setOpen,
}: UploadStageImageDialogProps) {
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
          <DialogTitle>Upload Stage Image</DialogTitle>
          <DialogDescription>
            Manually upload a stage 1, 2, or 3 image for this order.
          </DialogDescription>
        </DialogHeader>
        <UploadStageImageForm
          orderId={orderId}
          defaultStage={defaultStage}
          setResult={setResult}
        />
      </DialogContent>
    </Dialog>
  );
}
