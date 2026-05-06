"use client";

import { Button } from "@/components/ui/button";
import { pushBackToStage1 } from "./action";
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
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Result } from "@/lib/types";

type PushBackToStage1DialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  queue?: any;
  orderId?: string;
};

export const PushBackToStage1Dialog = ({
  open,
  setOpen,
  queue,
  orderId,
}: PushBackToStage1DialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [result, setResult] = useState<Result | null>(null);

  const handlePushBack = async () => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID is required",
      });
      return;
    }
    setLoading(true);
    const result = await pushBackToStage1(orderId);
    setResult(result);
    if (result.status === "success") {
      toast({
        title: "Success",
        description: result.messages?.[0] || "Pushed back to stage 1",
      });
      setLoading(false);
      setOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.messages?.[0] || "Failed to push back to stage 1",
      });
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Push Back to Stage 1</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to push{" "}
            <span className="font-bold text-red-600 hover:text-red-400">
              #{queue?.orderId}
            </span>{" "}
            back to stage 1?
            <br />
            This will reset the order and will delete pharmacist review on belt
            queue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {result?.status === "error" && (
          <div className="text-red-600">{result?.messages?.[0]}</div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <Button
            variant={"destructive"}
            className="text-white cursor-pointer"
            onClick={handlePushBack}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Pushing...
              </>
            ) : (
              "Push Back to Stage 1"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
