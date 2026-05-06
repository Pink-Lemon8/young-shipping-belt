"use client";

import { Button } from "@/components/ui/button";
import { deleteFromBelt } from "./action";
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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Result } from "@/lib/types";

type PushBackToStage1DialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  queue?: any;
  orderId?: string;
};

export const DeleteFromBeltDialog = ({
  open,
  setOpen,
  queue,
  orderId,
}: PushBackToStage1DialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [result, setResult] = useState<Result | null>(null);

  const handleDeleteFromBelt = async () => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID is required",
      });
      return;
    }
    setLoading(true);
    const result = await deleteFromBelt(orderId);
    setResult(result);
    if (result.status === "success") {
      toast({
        title: "Success",
        description: result.messages?.[0] || "Order deleted from belt",
      });
      setLoading(false);
      setOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.messages?.[0] || "Failed to delete from belt",
      });
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete from Belt</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-bold text-red-600 hover:text-red-400">
              #{queue?.orderId}{" "}
            </span>{" "}
            {queue?.groupId ? `and Grouped Orders ` : " "}
            from belt?
            <br />
            This will delete the order from belt queue.
            <br />
            <span className="text-red-600 font-bold">
              Please make sure you dont{" "}
              <strong className="underline uppercase">duplicate</strong> the
              order.
            </span>
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
            onClick={handleDeleteFromBelt}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete from Belt"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
