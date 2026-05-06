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
import { useRouter } from "next/navigation";
import { Result } from "@/lib/types";
import { SkipForwardIcon, UnlockIcon, XIcon } from "lucide-react";
import { unlock } from "./actions";
import { toast, useToast } from "@/components/hooks/use-toast";
export default function UnlockOrderModel({
  orderId,
  open,
  setOpen,
  setResult,
}: {
  orderId?: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [skipReason, setSkipReason] = useState<string | undefined>(undefined);
  const [result, dispatchResult] = useState<Result | undefined>(undefined);
  const router = useRouter();

  const SubmitSkipOrder = async () => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID is required",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await unlock(orderId);
    dispatchResult(res);
    setResult?.(res);
    if (res.status === "success") {
      toast({
        title: "Success",
        description: "Order unlocked",
      });
      setOpen(false);
    } else {
      toast({
        title: "Error",
        description: res.messages?.[0] ?? "Failed to unlock order",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {}, [open]);

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock Order</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            This order is currently locked by another user for processing.
            <br />
            Unlocking the order will allow any authorized user to take action on
            it.
            <br />
            <span className="font-semibold text-red-600">
              Are you sure you want to unlock this order and release it from the
              current user?
            </span>
          </AlertDialogDescription>

          <AlertDialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="gap-2 text-white"
              disabled={loading}
              onClick={async () => await SubmitSkipOrder()}
            >
              <UnlockIcon className="h-5 w-5 stroke-[2.5]" />
              {loading ? "Unlocking..." : "Unlock Order"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
