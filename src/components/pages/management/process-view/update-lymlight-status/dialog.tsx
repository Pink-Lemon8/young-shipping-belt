"use client";

import { useState } from "react";
import { Loader2, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Result } from "@/lib/types";
import { updateLymlightStatusFromProcessView } from "./action";

type UpdateLymlightStatusDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  queue?: any;
  orderId?: string;
};

export const UpdateLymlightStatusDialog = ({
  open,
  setOpen,
  queue,
  orderId,
}: UpdateLymlightStatusDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const { toast } = useToast();

  const handleUpdateLymlightStatus = async () => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID is required",
      });
      return;
    }

    setLoading(true);
    const actionResult = await updateLymlightStatusFromProcessView(orderId);
    setResult(actionResult);

    if (actionResult.status === "success") {
      toast({
        title: "Success",
        description:
          actionResult.messages?.[0] || "Lymlight status updated successfully",
      });
      setOpen(false);
    } else {
      toast({
        title: "Error",
        description:
          actionResult.messages?.[0] || "Failed to update Lymlight status",
      });
    }

    setLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Update Lymlight Status</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to update Lymlight status for{" "}
            <span className="font-bold text-primary">#{queue?.orderId}</span>
            {queue?.groupId ? " and grouped orders" : ""}?
            <br />
            This will only update the status on Lymlight for completed orders.
            <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-100/90 p-3 shadow-inner dark:border-amber-800 dark:bg-amber-900/60">
              <div className="mt-0.5 flex items-center justify-center">
                <TriangleAlertIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="mb-0.5 text-base font-semibold text-yellow-900 dark:text-yellow-200">
                  Warning
                </div>
                <div className="text-sm leading-relaxed text-yellow-800 dark:text-yellow-100">
                  Please make sure the Lymlight order is ready before updating.
                  This action can change the external Lymlight status for this
                  order{queue?.groupId ? " group" : ""}.
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {result?.status === "error" && (
          <div className="text-red-600">{result.messages?.[0]}</div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleUpdateLymlightStatus}
            disabled={loading}
            className="cursor-pointer bg-violet-600 text-white hover:bg-violet-700"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Updating...
              </>
            ) : (
              "Update Lymlight Status"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
