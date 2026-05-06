"use client";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDescription } from "@/components/ui/alert";
import { Alert } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { addBarcodeToPackage } from "@/components/pages/belt/action";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
type WrongItemDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  scannedBarcode?: string;
  items?: any[];
  packagesBarcodes?: any[];
};

export function WrongItemDialog({
  open,
  setOpen,
  scannedBarcode,
  items,
  packagesBarcodes,
}: WrongItemDialogProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  const handleAddBarcode = async () => {
    if (!selectedPackageId || !scannedBarcode || !items) return;

    setIsLoading(true);
    setResult(null);

    try {
      // Find the selected item
      const selectedItem = items.find(
        (item: any) => item.packageId === selectedPackageId,
      );
      if (!selectedItem) {
        setResult({ status: "error", message: "Selected package not found" });
        setIsLoading(false);
        return;
      }

      // Use legacyId if available, otherwise use packageId
      const packageIdForDb = selectedItem.legacyId ?? selectedItem.packageId;
      // Extract numeric package ID (remove "DP-" prefix if present)
      const numericPackageId = String(packageIdForDb)
        ? parseInt(String(packageIdForDb).split("-")[1])
        : parseInt(String(packageIdForDb));

      const response = await addBarcodeToPackage(
        scannedBarcode,
        numericPackageId,
        !selectedItem.legacyId && String(packageIdForDb).startsWith("PP-")
          ? true
          : false,
      );

      if (response.status === "success") {
        setResult({
          status: "success",
          message: "Barcode added successfully! Refreshing...",
        });
        // Wait a bit then close and refresh
        setTimeout(() => {
          setOpen(false);
          setSelectedPackageId("");
          setResult(null);
          router.refresh();
        }, 500);
      } else {
        setResult({
          status: "error",
          message: response.messages?.[0] ?? "Failed to add barcode",
        });
      }
    } catch (error) {
      setResult({
        status: "error",
        message: "An error occurred while adding barcode",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setShowAddForm(false);
    setSelectedPackageId("");
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-red-500/30">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Wrong Item Scanned
          </DialogTitle>
          <DialogDescription>
            You have scanned an item that is not part of this order.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-red-200 bg-red-100/50 dark:bg-red-900/20 dark:border-red-900/30 text-red-800 dark:text-red-300">
          <AlertCircle className="h-4 w-4 stroke-red-600" />
          <AlertDescription>
            Please verify you are scanning the correct items for this order.
          </AlertDescription>
        </Alert>

        {scannedBarcode && (
          <div className="p-3 bg-muted rounded-md flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Scanned Barcode:</p>
            <p className="font-mono font-semibold text-lg">{scannedBarcode}</p>
          </div>
        )}

        {showAddForm && scannedBarcode && items && items.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Add this barcode to a package:
              </p>
              <Select
                value={selectedPackageId}
                onValueChange={setSelectedPackageId}
                disabled={isLoading || result?.status === "success"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a package..." />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item: any) => (
                    <SelectItem key={item.packageId} value={item.packageId}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {item.packageId}
                          {item.legacyId && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              ({item.legacyId})
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {result && (
              <Alert
                className={cn(
                  "flex items-center gap-2",
                  result?.status === "success"
                    ? "border-green-200 bg-green-100/50 dark:bg-green-900/20 dark:border-green-900/30 text-green-800 dark:text-green-300"
                    : "border-red-200 bg-red-100/50 dark:bg-red-900/20 dark:border-red-900/30 text-red-800 dark:text-red-300",
                )}
              >
                {result?.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 stroke-green-600 -mt-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 stroke-red-600 -mt-1" />
                )}
                <AlertDescription>{result?.message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {scannedBarcode && items && items.length > 0 && !showAddForm && (
            <Button
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Barcode
            </Button>
          )}
          {showAddForm && (
            <Button
              variant="outline"
              className={cn(
                "border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950",
                result?.status === "success" &&
                  "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950",
              )}
              onClick={handleAddBarcode}
              disabled={
                !selectedPackageId || isLoading || result?.status === "success"
              }
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : result?.status === "success" ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {result?.status === "success" ? "Saved!" : "Save Barcode"}
            </Button>
          )}
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleClose}
            disabled={isLoading}
          >
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
