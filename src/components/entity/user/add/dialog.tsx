"use client";
import { Dialog } from "@/components/ui/dialog";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddUserForm } from "./form";
import { Result } from "@/lib/types";
import { useEffect, useState } from "react";

type AddUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};

export function AddUserDialog({
  open,
  onOpenChange,
  setResult,
}: AddUserDialogProps) {
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
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user</DialogDescription>
        </DialogHeader>
        <AddUserForm setResult={dispatchResult} />
      </DialogContent>
    </Dialog>
  );
}
