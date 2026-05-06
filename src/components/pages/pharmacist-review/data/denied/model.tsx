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
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { pharmacistReviewStatusTypes } from "@/db/schema";
import { useRouter } from "next/navigation";
import { Result } from "@/lib/types";
import { XIcon } from "lucide-react";

export default function DeniedModel({
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
  const [denyReason, setDenyReason] = useState<string>("");
  const router = useRouter();
  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deny Order</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Please provide a reason for denying this order.
          </AlertDialogDescription>
          <Textarea
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            maxLength={255}
            placeholder="Enter reason for denial"
          />
          <AlertDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2 text-white"
              onClick={async () => await onPushQueue("DENIED", denyReason)}
            >
              <XIcon className="h-5 w-5" />
              Deny
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
