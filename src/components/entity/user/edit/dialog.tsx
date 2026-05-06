"use client";
import { Dialog } from "@/components/ui/dialog";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditUserForm } from "./form";
import { Result } from "@/lib/types";
import { useEffect, useState } from "react";
import { User } from "../type";

type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  setResult,
}: EditUserDialogProps) {
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
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Edit the user {user?.name} - {user?.email}
          </DialogDescription>
        </DialogHeader>
        <EditUserForm user={user} setResult={dispatchResult} />
      </DialogContent>
    </Dialog>
  );
}
