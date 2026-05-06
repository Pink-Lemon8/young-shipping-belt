"use client";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Result } from "@/lib/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import PasskeyForm from "./form";
import { Button } from "@/components/ui/button";

type PasskeyDialogProps = {
  open: boolean;
  setDisabled?: Dispatch<SetStateAction<boolean>>;
  onOpenChange: (open: boolean) => void;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};

export function PasskeyDialog({
  open,
  setDisabled,
  onOpenChange,
  setResult,
}: PasskeyDialogProps) {
  const [result, dispatchResult] = useState<Result | undefined>(undefined);
  useEffect(() => {
    if (result?.status === "success") {
      onOpenChange(false);
      setResult?.(result);
    }
  }, [result]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[550px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Passkey</DialogTitle>
          <DialogDescription>Manage your passkeys</DialogDescription>
        </DialogHeader>
        <PasskeyForm setResult={setResult} />
        <DialogFooter>
          <Button
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
