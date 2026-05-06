"use client";

import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type OverItemProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentOverScanItem?: any;
  scannedCounts?: any;
  getItemKey?: (item: { orderId?: string; packageId: string }) => string;
};

export function OverScanItemDialog({
  open,
  setOpen,
  currentOverScanItem,
  scannedCounts,
  getItemKey,
}: OverItemProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-amber-500 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Over-Scanning Detected
          </DialogTitle>
          <DialogDescription>
            You are trying to add more items than the order cart, please verify.
          </DialogDescription>
        </DialogHeader>

        {currentOverScanItem && (
          <div className="p-3 border rounded-md bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <span className="font-bold text-primary">
                  {currentOverScanItem.packageId}
                </span>
              </div>
              <div>
                <p className="font-medium">{currentOverScanItem.description}</p>
                <p className="text-sm text-muted-foreground">
                  Required quantity: {currentOverScanItem.quantity}
                </p>
                <p className="text-sm font-medium text-amber-600">
                  Already scanned:{" "}
                  {scannedCounts?.[
                    getItemKey?.(currentOverScanItem) ??
                      currentOverScanItem.packageId
                  ] || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Understood</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
