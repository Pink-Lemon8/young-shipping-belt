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
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getExpectedOrderItemsByOrderId,
  updateExpectedOrderItemFlags,
  updateExpectedOrderItemOrdered,
  updateExpectedOrderItemReceived,
  updateExpectedOrderItemSpecial,
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
          ? {
            ...currentItem,
            ordered,
            special: ordered ? false : currentItem.special,
            received: false,
          }
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

  const handleSpecialChange = async (item: any, special: boolean) => {
    if (!item.orderId || !item.orderedKey) return;

    const previousItems = items;
    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.orderId === item.orderId &&
          currentItem.orderedKey === item.orderedKey
          ? {
            ...currentItem,
            ordered: special ? false : currentItem.ordered,
            special,
            received: false,
          }
          : currentItem,
      ),
    );
    setSavingKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      nextKeys.add(`${item.orderId}:${item.orderedKey}`);
      return nextKeys;
    });

    const result = await updateExpectedOrderItemSpecial({
      orderId: item.orderId,
      orderedKey: item.orderedKey,
      special,
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

  const handleReceivedChange = async (item: any, received: boolean) => {
    if (!item.orderId || !item.orderedKey || (!item.ordered && !item.special)) {
      return;
    }

    const previousItems = items;
    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.orderId === item.orderId &&
          currentItem.orderedKey === item.orderedKey
          ? { ...currentItem, received }
          : currentItem,
      ),
    );
    setSavingKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      nextKeys.add(`${item.orderId}:${item.orderedKey}`);
      return nextKeys;
    });

    const result = await updateExpectedOrderItemReceived({
      orderId: item.orderId,
      orderedKey: item.orderedKey,
      received,
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

  const handleBulkOrderedChange = async (ordered: boolean) => {
    const itemsToUpdate = items.filter((item) => item.orderId && item.orderedKey);
    if (itemsToUpdate.length === 0 || savingKeys.size > 0) return;

    const previousItems = items;
    const keysToSave = itemsToUpdate.map(
      (item) => `${item.orderId}:${item.orderedKey}`,
    );

    setItems((currentItems) =>
      currentItems.map((item) => ({
        ...item,
        ordered,
        special: ordered ? false : item.special,
        received: false,
      })),
    );
    setSavingKeys(new Set(keysToSave));

    const result = await updateExpectedOrderItemFlags(
      itemsToUpdate.map((item) => ({
        orderId: item.orderId,
        orderedKey: item.orderedKey,
        ordered,
      })),
    );

    setSavingKeys(new Set());

    if (result?.status !== "success") {
      setItems(previousItems);
      toast({
        title: "Could not update items",
        description: result?.message ?? "Please try again.",
        variant: "destructive",
      });
    } else {
      router.refresh();
    }
  };

  const handleBulkSpecialChange = async (special: boolean) => {
    const itemsToUpdate = items.filter((item) => item.orderId && item.orderedKey);
    if (itemsToUpdate.length === 0 || savingKeys.size > 0) return;

    const previousItems = items;
    const keysToSave = itemsToUpdate.map(
      (item) => `${item.orderId}:${item.orderedKey}`,
    );

    setItems((currentItems) =>
      currentItems.map((item) => ({
        ...item,
        ordered: special ? false : item.ordered,
        special,
        received: false,
      })),
    );
    setSavingKeys(new Set(keysToSave));

    const result = await updateExpectedOrderItemFlags(
      itemsToUpdate.map((item) => ({
        orderId: item.orderId,
        orderedKey: item.orderedKey,
        special,
      })),
    );

    setSavingKeys(new Set());

    if (result?.status !== "success") {
      setItems(previousItems);
      toast({
        title: "Could not update items",
        description: result?.message ?? "Please try again.",
        variant: "destructive",
      });
    } else {
      router.refresh();
    }
  };

  const handleBulkReceivedChange = async (received: boolean) => {
    const itemsToUpdate = items.filter(
      (item) =>
        item.orderId &&
        item.orderedKey &&
        (item.ordered || item.special || !received),
    );
    if (itemsToUpdate.length === 0 || savingKeys.size > 0) return;

    const previousItems = items;
    const keysToSave = itemsToUpdate.map(
      (item) => `${item.orderId}:${item.orderedKey}`,
    );

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.ordered || item.special || !received
          ? { ...item, received }
          : item,
      ),
    );
    setSavingKeys(new Set(keysToSave));

    const result = await updateExpectedOrderItemFlags(
      itemsToUpdate.map((item) => ({
        orderId: item.orderId,
        orderedKey: item.orderedKey,
        received,
      })),
    );

    setSavingKeys(new Set());

    if (result?.status !== "success") {
      setItems(previousItems);
      toast({
        title: "Could not update items",
        description: result?.message ?? "Please try again.",
        variant: "destructive",
      });
    } else {
      router.refresh();
    }
  };

  const hasItems = items.length > 0;
  const isSaving = savingKeys.size > 0;
  const allItemsOrdered = hasItems && items.every((item) => item.ordered);
  const allItemsSpecial = hasItems && items.every((item) => item.special);
  const allItemsReceived = hasItems && items.every((item) => item.received);
  const anyItemsOrdered = items.some((item) => item.ordered);
  const anyItemsSpecial = items.some((item) => item.special);
  const allItemsEligibleForReceive =
    hasItems && items.every((item) => item.ordered || item.special);
  const nextOrderedValue = !allItemsOrdered;
  const nextSpecialValue = !allItemsSpecial;
  const nextReceivedValue = !allItemsReceived;
  const getBulkButtonClass = (isClear: boolean) =>
    cn(
      "h-4 px-1 mt-0.5 text-[9px] leading-none",
      isClear
        ? "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        : "border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700",
    );
  const getSpecialBulkButtonClass = (isClear: boolean) =>
    cn(
      "h-4 px-1 mt-0.5 text-[9px] leading-none",
      isClear
        ? "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        : "border-purple-500/40 text-purple-700 hover:bg-purple-500/10 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-300",
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100vw-1rem)] flex-col overflow-hidden p-4 sm:max-w-[720px] sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Order Items
          </DialogTitle>
          <DialogDescription>
            {orderId ? `Expected items for order ${orderId}` : "Order items"}
          </DialogDescription>
        </DialogHeader>

        <div className="grow overflow-y-auto pr-1 -mr-1 sm:pr-2 sm:-mr-2">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="hidden border rounded-md overflow-hidden md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-[150px] text-left p-3 font-medium">
                        Package ID
                      </th>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-left p-3 font-medium">DIN</th>
                      <th className="text-right p-3 font-medium">Qty</th>
                      <th className="px-1 py-3 font-medium">
                        <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                          <span>Ordered</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={getBulkButtonClass(allItemsOrdered)}
                            disabled={
                              !hasItems ||
                              isSaving ||
                              (nextOrderedValue && anyItemsSpecial)
                            }
                            aria-label={
                              allItemsOrdered
                                ? "Clear ordered items"
                                : "Mark all items as ordered"
                            }
                            onClick={() => handleBulkOrderedChange(nextOrderedValue)}
                          >
                            {allItemsOrdered ? "Clear" : "All"}
                          </Button>
                        </div>
                      </th>
                      <th className="px-1 py-3 font-medium">
                        <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                          <span>Special</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={getSpecialBulkButtonClass(allItemsSpecial)}
                            disabled={
                              !hasItems ||
                              isSaving ||
                              (nextSpecialValue && anyItemsOrdered)
                            }
                            aria-label={
                              allItemsSpecial
                                ? "Clear special items"
                                : "Mark all items as special"
                            }
                            onClick={() => handleBulkSpecialChange(nextSpecialValue)}
                          >
                            {allItemsSpecial ? "Clear" : "All"}
                          </Button>
                        </div>
                      </th>
                      <th className="px-1 py-3 font-medium">
                        <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                          <span>Received</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={getBulkButtonClass(allItemsReceived)}
                            disabled={
                              !hasItems ||
                              isSaving ||
                              (nextReceivedValue && !allItemsEligibleForReceive)
                            }
                            aria-label={
                              allItemsReceived
                                ? "Clear received items"
                                : "Mark all items as received"
                            }
                            onClick={() =>
                              handleBulkReceivedChange(nextReceivedValue)
                            }
                          >
                            {allItemsReceived ? "Clear" : "All"}
                          </Button>
                        </div>
                      </th>
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
                                <Skeleton className="h-4 w-32" />
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
                              <td className="px-2 py-3">
                                <Skeleton className="mx-auto h-4 w-4 rounded-sm" />
                              </td>
                              <td className="px-2 py-3">
                                <Skeleton className="mx-auto h-4 w-4 rounded-sm" />
                              </td>
                              <td className="px-2 py-3">
                                <Skeleton className="mx-auto h-4 w-4 rounded-sm" />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="w-[150px] whitespace-nowrap p-3 font-mono">
                                {item.packageId}
                              </td>
                              <td className="p-3">{item.description || "N/A"}</td>
                              <td className="p-3">{item.din || "N/A"}</td>
                              <td className="p-3 text-right">{item.quantity}</td>
                              <td className="px-2 py-3 text-center">
                                <Checkbox
                                  checked={Boolean(item.ordered)}
                                  disabled={Boolean(item.special)}
                                  aria-label={`Mark ${item.description || item.packageId} as ordered`}
                                  onCheckedChange={(checked) =>
                                    handleOrderedChange(item, checked === true)
                                  }
                                />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <Checkbox
                                  checked={Boolean(item.special)}
                                  disabled={Boolean(item.ordered)}
                                  aria-label={`Mark ${item.description || item.packageId} as special`}
                                  onCheckedChange={(checked) =>
                                    handleSpecialChange(item, checked === true)
                                  }
                                />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <Checkbox
                                  checked={Boolean(item.received)}
                                  disabled={!item.ordered && !item.special}
                                  aria-label={`Mark ${item.description || item.packageId} as received`}
                                  onCheckedChange={(checked) =>
                                    handleReceivedChange(item, checked === true)
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
              <div className="space-y-3 md:hidden">
                <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/30 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Ordered</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={getBulkButtonClass(allItemsOrdered)}
                      disabled={
                        !hasItems ||
                        isSaving ||
                        (nextOrderedValue && anyItemsSpecial)
                      }
                      aria-label={
                        allItemsOrdered
                          ? "Clear ordered items"
                          : "Mark all items as ordered"
                      }
                      onClick={() => handleBulkOrderedChange(nextOrderedValue)}
                    >
                      {allItemsOrdered ? "Clear" : "All"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Special</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={getSpecialBulkButtonClass(allItemsSpecial)}
                      disabled={
                        !hasItems ||
                        isSaving ||
                        (nextSpecialValue && anyItemsOrdered)
                      }
                      aria-label={
                        allItemsSpecial
                          ? "Clear special items"
                          : "Mark all items as special"
                      }
                      onClick={() => handleBulkSpecialChange(nextSpecialValue)}
                    >
                      {allItemsSpecial ? "Clear" : "All"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Received</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={getBulkButtonClass(allItemsReceived)}
                      disabled={
                        !hasItems ||
                        isSaving ||
                        (nextReceivedValue && !allItemsEligibleForReceive)
                      }
                      aria-label={
                        allItemsReceived
                          ? "Clear received items"
                          : "Mark all items as received"
                      }
                      onClick={() => handleBulkReceivedChange(nextReceivedValue)}
                    >
                      {allItemsReceived ? "Clear" : "All"}
                    </Button>
                  </div>
                </div>

                {items.map((item: any, index: number) => {
                  const savingKey = `${item.orderId}:${item.orderedKey}`;
                  const isSaving = savingKeys.has(savingKey);

                  return (
                    <div key={savingKey || index} className="rounded-md border p-3">
                      {isSaving ? (
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-full" />
                          <div className="grid grid-cols-3 gap-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <div className="truncate font-mono text-xs text-muted-foreground">
                              {item.packageId}
                            </div>
                            <div className="mt-1 text-sm font-medium">
                              {item.description || "N/A"}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">DIN</span>
                              <div className="font-medium">{item.din || "N/A"}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Qty</span>
                              <div className="font-medium">{item.quantity}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 border-t pt-3">
                            <label className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-2 text-xs font-medium">
                              Ordered
                              <Checkbox
                                checked={Boolean(item.ordered)}
                                disabled={Boolean(item.special)}
                                aria-label={`Mark ${item.description || item.packageId} as ordered`}
                                onCheckedChange={(checked) =>
                                  handleOrderedChange(item, checked === true)
                                }
                              />
                            </label>
                            <label className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-2 text-xs font-medium">
                              Special
                              <Checkbox
                                checked={Boolean(item.special)}
                                disabled={Boolean(item.ordered)}
                                aria-label={`Mark ${item.description || item.packageId} as special`}
                                onCheckedChange={(checked) =>
                                  handleSpecialChange(item, checked === true)
                                }
                              />
                            </label>
                            <label className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-2 text-xs font-medium">
                              Received
                              <Checkbox
                                checked={Boolean(item.received)}
                                disabled={!item.ordered && !item.special}
                                aria-label={`Mark ${item.description || item.packageId} as received`}
                                onCheckedChange={(checked) =>
                                  handleReceivedChange(item, checked === true)
                                }
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
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
