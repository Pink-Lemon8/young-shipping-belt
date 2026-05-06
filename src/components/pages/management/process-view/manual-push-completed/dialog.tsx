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
import { manualPushCompletedFromProcessView } from "./action";

type ManualPushCompletedDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  queue?: any;
  orderId?: string;
};

export const ManualPushCompletedDialog = ({
  open,
  setOpen,
  queue,
  orderId,
}: ManualPushCompletedDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const { toast } = useToast();

  const handleManualPushCompleted = async () => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID is required",
      });
      return;
    }

    setLoading(true);
    const actionResult = await manualPushCompletedFromProcessView(orderId);
    setResult(actionResult);

    if (actionResult.status === "success") {
      toast({
        title: "Success",
        description: actionResult.messages?.[0] || "Order marked as completed",
      });
      setOpen(false);
    } else {
      toast({
        title: "Error",
        description: actionResult.messages?.[0] || "Failed to complete order",
      });
    }

    setLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="w-[calc(100%-1rem)] max-w-md p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>Manual Push Completed</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-left">
            <p>
              Are you sure you want to mark{" "}
              <span className="font-bold text-primary">#{queue?.orderId}</span>{" "}
              {queue?.groupId ? "and grouped orders " : ""}
              as completed?
            </p>

            <p>
              This action is only available for stage 2 and stage 3 orders in
              process view.
            </p>

            {queue?.affiliateId === -1 && (
              <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-100/90 p-3 shadow-inner dark:border-amber-800 dark:bg-amber-900/60">
                <div className="mt-0.5 flex shrink-0 items-center justify-center">
                  <TriangleAlertIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <div className="mb-1 text-sm font-semibold text-yellow-900 dark:text-yellow-200 sm:text-base">
                    Heads up!
                  </div>
                  <div className="text-xs leading-relaxed text-yellow-800 dark:text-yellow-100 sm:text-sm">
                    Marking this order as{" "}
                    <span className="font-bold text-green-800 dark:text-green-200">
                      manually completed
                    </span>{" "}
                    will
                    <span className="mx-1 underline">
                      also update its Lymlight status
                    </span>
                    if the order is from Lymlight. Please double-check before
                    proceeding.
                  </div>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {result?.status === "error" && (
          <div className="text-red-600">{result.messages?.[0]}</div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="w-full cursor-pointer sm:w-auto"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleManualPushCompleted}
            disabled={loading}
            className="w-full cursor-pointer bg-green-600 text-white hover:bg-green-700 sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Completing...
              </>
            ) : (
              "Manual Push Completed"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
