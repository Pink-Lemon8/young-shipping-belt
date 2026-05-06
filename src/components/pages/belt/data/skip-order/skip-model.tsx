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
import { SkipForwardIcon, XIcon } from "lucide-react";
import { skip } from "./actions";
import { toast, useToast } from "@/components/hooks/use-toast";
export default function SkipOrderModel({
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
    const res = await skip(orderId, skipReason);
    dispatchResult(res);
    setResult?.(res);
    if (res.status === "success") {
      toast({
        title: "Success",
        description: "Order skipped",
      });
      setOpen(false);
    } else {
      toast({
        title: "Error",
        description: res.messages?.[0] ?? "Failed to skip order",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    setSkipReason(undefined);
  }, [open]);

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Order</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Please provide a reason for skipping this order.
          </AlertDialogDescription>
          <Textarea
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            maxLength={255}
            rows={3}
            disabled={loading}
            placeholder="Enter reason for skipping"
          />

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
              {loading ? "Skipping..." : "Skip Order"}
              <SkipForwardIcon className="h-5 w-5" />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
