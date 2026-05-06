"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Pill } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  getExpectedOrderItemsByOrderId,
  updateExpectedOrderItemOrdered,
} from "../info/action";

type ViewItemsDialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  orderId?: string;
};

export function ViewItemsDialog({
  open,
  setOpen,
  orderId,
}: ViewItemsDialogProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!open || !orderId) return;
    let cancelled = false;
    setLoading(true);
    getExpectedOrderItemsByOrderId(orderId)
      .then((res) => {
        if (cancelled) return;
        setItems(res?.status === "success" ? res.data : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  const handleOrderedChange = async (item: any, ordered: boolean) => {
    if (!item.orderId || !item.orderedKey) return;

    const previousItems = items;
    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.orderId === item.orderId &&
        currentItem.orderedKey === item.orderedKey
          ? { ...currentItem, ordered }
          : currentItem,
      ),
    );
    setSavingKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      nextKeys.add(`${item.orderId}:${item.orderedKey}`);
      return nextKeys;
    });

    const result = await updateExpectedOrderItemOrdered({
      orderId: item.orderId,
      orderedKey: item.orderedKey,
      ordered,
    });

    setSavingKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      nextKeys.delete(`${item.orderId}:${item.orderedKey}`);
      return nextKeys;
    });

    if (result?.status !== "success") {
      setItems(previousItems);
      toast({
        title: "Could not update item",
        description: result?.message ?? "Please try again.",
        variant: "destructive",
      });
    } else {
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Order Items
          </DialogTitle>
          <DialogDescription>
            {orderId ? `Expected items for order ${orderId}` : "Order items"}
          </DialogDescription>
        </DialogHeader>

        <div className="grow overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Package ID</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-left p-3 font-medium">DIN</th>
                    <th className="text-right p-3 font-medium">Qty</th>
                    <th className="text-center p-3 font-medium">Ordered</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => {
                    const savingKey = `${item.orderId}:${item.orderedKey}`;
                    const isSaving = savingKeys.has(savingKey);

                    return (
                      <tr key={savingKey || index} className="border-t">
                        {isSaving ? (
                          <>
                            <td className="p-3">
                              <Skeleton className="h-4 w-24" />
                            </td>
                            <td className="p-3">
                              <Skeleton className="h-4 w-full max-w-56" />
                            </td>
                            <td className="p-3">
                              <Skeleton className="h-4 w-20" />
                            </td>
                            <td className="p-3">
                              <Skeleton className="ml-auto h-4 w-8" />
                            </td>
                            <td className="p-3">
                              <Skeleton className="mx-auto h-4 w-4 rounded-sm" />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-mono">{item.packageId}</td>
                            <td className="p-3">{item.description || "N/A"}</td>
                            <td className="p-3">{item.din || "N/A"}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-center">
                              <Checkbox
                                checked={Boolean(item.ordered)}
                                aria-label={`Mark ${item.description || item.packageId} as ordered`}
                                onCheckedChange={(checked) =>
                                  handleOrderedChange(item, checked === true)
                                }
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-6">
              No items recorded for this order
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
