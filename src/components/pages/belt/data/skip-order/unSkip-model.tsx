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
import { useRouter } from "next/navigation";
import { Result } from "@/lib/types";
import { CheckIcon } from "lucide-react";
import { OpenSkipping } from "./actions";
import { toast } from "sonner";

export default function UnSkipOrderModel({
  orderId,
  reason,
  open,
  setOpen,
}: {
  orderId?: string;
  reason?: string[];
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [skipReason, setSkipReason] = useState<string | undefined>(undefined);
  const router = useRouter();

  const SubmitSkipOrder = async () => {
    if (!orderId) {
      toast.error("Order ID is required");
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await OpenSkipping(orderId);
    if (result.status === "success") {
      setOpen(false);
      toast.success("Order unskipped");
    } else {
      toast.error(result.messages?.[0] ?? "Failed to unskip order");
    }
    setLoading(false);
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Order</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to open this order for belt?
            {reason !== undefined && reason?.length > 0 && (
              <>
                <br />
                <span className="font-bold text-red-600">Reason: </span>
                <span className="text-sm">{reason?.join(", ")}</span>
              </>
            )}
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
              <CheckIcon className="h-5 w-5" />
              {loading ? "Opening..." : "Open Order"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
