"use client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { pharmacistReviewStatusTypes } from "@/db/schema";
import { Result } from "@/lib/types";
import { CheckIcon } from "lucide-react";

export default function ApprovedModel({
  open,
  setOpen,
  onPushQueue,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onPushQueue: (
    review: (typeof pharmacistReviewStatusTypes)[number],
    comment: string | undefined
  ) => Promise<Result>;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === "Enter" && open) {
        event.preventDefault();
        onPushQueue("APPROVED", undefined).then(() => {
          setOpen(false);
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Order</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2 text-white bg-green-600 hover:bg-green-500"
              onClick={async () => await onPushQueue("APPROVED", undefined)}
            >
              <CheckIcon className="h-5 w-5" />
              Approve
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
