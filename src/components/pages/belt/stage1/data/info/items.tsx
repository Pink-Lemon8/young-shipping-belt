"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Check,
  CheckCheck,
  CheckCircle2,
  Copy,
  Edit,
  EditIcon,
  Orbit,
  Package2,
  Plus,
  QrCode,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { useBarcodeScanner } from "@/components/hooks/use-barcode-scanner";
import { WrongItemDialog } from "./items/wrong-item";
import { OverScanItemDialog } from "./items/over-scan-item";
import { WarningMissingLotDialog } from "./items/warning-missing-lot";

type LotEntry = {
  scanIndex: number;
  lotNumber: string;
};

/** Unique key per order line (same package in different orders = different keys) */
function getItemKey(item: { orderId?: string; packageId: string }): string {
  return `${item.orderId ?? ""}-${item.packageId}`;
}

type InfoItemProps = {
  items: any[];
  packagesBarcodes: any[];

  scanReady: boolean;
  setScanReady: React.Dispatch<React.SetStateAction<boolean>>;

  lotReady: boolean;
  setLotReady: React.Dispatch<React.SetStateAction<boolean>>;

  readyToPicture: boolean;
  setReadyToPicture: React.Dispatch<React.SetStateAction<boolean>>;

  result: any;
  setResult: React.Dispatch<React.SetStateAction<any>>;
};

export function InfoItems({
  items,
  packagesBarcodes,
  scanReady,
  setScanReady,
  lotReady,
  setLotReady,
  readyToPicture,
  setReadyToPicture,
  result,
  setResult,
}: InfoItemProps) {
  const [scannedCounts, setScannedCounts] = useState<Record<string, number>>(
    {},
  );

  const [lotNumbers, setLotNumbers] = useState<Record<string, LotEntry[]>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [sharedLotNumbers, setSharedLotNumbers] = useState<
    Record<string, string>
  >({});

  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showOverScanDialog, setShowOverScanDialog] = useState(false);

  const [showLotWarningDialog, setShowLotWarningDialog] = useState(false);

  const [showWrongItemDialog, setShowWrongItemDialog] = useState(false);

  const [incompleteItems, setIncompleteItems] = useState<any[]>([]);
  const [currentOverScanItem, setCurrentOverScanItem] = useState<any>(null);
  const [itemsWithMissingLots, setItemsWithMissingLots] = useState<any[]>([]);

  const { barcode, resetBarcode, scanCount, resetScanCount } =
    useBarcodeScanner();

  const handleScan = (itemId: string) => {
    const candidates = items.filter(
      (i) =>
        (i.legacyId ?? i.packageId) === itemId ||
        i.lymlightPackageId === itemId,
    );
    if (!candidates.length) return;

    // When same package appears in multiple orders, target the first incomplete line
    const item =
      candidates.find(
        (i) => (scannedCounts[getItemKey(i)] || 0) < (i.quantity || 0),
      ) ?? candidates[0];

    const key = getItemKey(item);
    const currentCount = scannedCounts[key] || 0;
    const maxCount = item.quantity || 0;

    if (currentCount >= maxCount) {
      setCurrentOverScanItem(item);
      setShowOverScanDialog(true);
      return;
    }

    setScannedCounts((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));

    setLotNumbers((prev) => {
      const itemLots = prev[key] || [];
      return {
        ...prev,
        [key]: [...itemLots, { scanIndex: currentCount, lotNumber: "" }],
      };
    });

    setExpandedItems((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  const checkBarcode = (scannedBarcode: string) => {
    const item = packagesBarcodes.find((i) => i.barcode === scannedBarcode);
    return item;
  };

  const getProgress = (itemKey: string, quantity: number) => {
    const scanned = scannedCounts[itemKey] || 0;
    return (scanned / quantity) * 100;
  };

  const isComplete = (itemKey: string, quantity: number) => {
    const scanned = scannedCounts[itemKey] || 0;
    return scanned >= quantity;
  };

  const handleLotNumberChange = (
    itemKey: string,
    scanIndex: number,
    lotNumber: string,
  ) => {
    setLotReady(false);

    setLotNumbers((prev) => {
      const itemLots = [...(prev[itemKey] || [])];
      const entryIndex = itemLots.findIndex(
        (entry) => entry.scanIndex === scanIndex,
      );

      if (entryIndex >= 0) {
        itemLots[entryIndex] = { ...itemLots[entryIndex], lotNumber };
      } else {
        itemLots.push({ scanIndex, lotNumber });
      }

      return {
        ...prev,
        [itemKey]: itemLots,
      };
    });
  };

  const handleSharedLotChange = (itemKey: string, lotNumber: string) => {
    setSharedLotNumbers((prev) => ({
      ...prev,
      [itemKey]: lotNumber,
    }));
  };

  const applySharedLot = (itemKey: string) => {
    // Reset success state when editing
    setLotReady(false);

    const sharedLot = sharedLotNumbers[itemKey] || "";
    if (!sharedLot.trim()) return;

    const scanned = scannedCounts[itemKey] || 0;
    const currentLots = lotNumbers[itemKey] || [];
    const totalLots = Math.max(scanned, currentLots.length);

    if (totalLots === 0) return;

    // Apply the shared LOT number to all lot entries (scanned + additional)
    setLotNumbers((prev) => {
      const newLots = Array.from({ length: totalLots }).map((_, idx) => ({
        scanIndex: idx,
        lotNumber: sharedLot,
      }));

      return {
        ...prev,
        [itemKey]: newLots,
      };
    });
  };

  const checkMissingLotNumbers = () => {
    // Check if items array exists and is not empty
    if (!items || !Array.isArray(items) || items.length === 0) {
      return [];
    }

    const itemsWithMissingLots = items.filter((item) => {
      const key = getItemKey(item);
      const scanned = scannedCounts[key] || 0;
      const itemLots = lotNumbers[key] || [];

      // Skip items that haven't been scanned and have no additional lots
      if (scanned === 0 && itemLots.length === 0) return false;

      // Check if we have at least the quantity amount of LOT numbers
      const minRequiredLots = Math.max(scanned, item.quantity);
      if (itemLots.length < minRequiredLots) return true;

      // Check if any lot numbers are missing or empty
      return itemLots.some((entry) => !entry.lotNumber.trim());
    });

    return itemsWithMissingLots;
  };

  const checkAllComplete = (locked: boolean = true) => {
    // Check if items array exists and is not empty
    if (!items || !Array.isArray(items) || items.length === 0) {
      return false;
    }

    // Check if all items are fully scanned
    const allScanned = items.every((item) => {
      const scanned = scannedCounts[getItemKey(item)] || 0;
      return scanned >= item.quantity;
    });

    if (!allScanned) return false;
    setScanReady(true);
    // Check if all scanned items have LOT numbers
    const missingLots = checkMissingLotNumbers();
    const checkAllLotsComplete = missingLots.length === 0;
    setLotReady(checkAllLotsComplete);

    if (checkAllLotsComplete && locked) {
      setReadyToPicture(true);
      setResult({ scannedCounts, lotNumbers });
    }

    return checkAllLotsComplete;
  };

  const handleSubmit = () => {
    // Check if items array exists and is not empty
    if (!items || !Array.isArray(items) || items.length === 0) {
      return;
    }

    const incomplete = items.filter((item) => {
      const scanned = scannedCounts[getItemKey(item)] || 0;
      return scanned < item.quantity;
    });

    if (incomplete.length > 0) {
      setIncompleteItems(incomplete);
      setShowWarningDialog(true);
      return;
    }

    // Check for missing LOT numbers
    const missingLots = checkMissingLotNumbers();
    if (missingLots.length > 0) {
      setItemsWithMissingLots(missingLots);
      setShowLotWarningDialog(true);
      return;
    }

    checkAllComplete(true);
  };

  const resetScans = () => {
    setScannedCounts({});
    setLotNumbers({});
    setSharedLotNumbers({});
    setExpandedItems({});
    setScanReady(false);
    setLotReady(false);
    setReadyToPicture(false);
    resetBarcode(true);
  };

  useEffect(() => {
    checkAllComplete(false);
  }, [lotNumbers]);

  useEffect(() => {
    if (barcode) {
      const item = checkBarcode(barcode);
      if (item) handleScan(item.pwPackageId ?? item.lymlightPackageId);
      else setShowWrongItemDialog(true);
    }
  }, [barcode, scanCount]);

  // Initialize all items as expanded
  useEffect(() => {
    if (items && items.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      items.forEach((item: any) => {
        initialExpanded[getItemKey(item)] = true;
      });
      setExpandedItems(initialExpanded);
    }
  }, [items]);

  const itemsByOrderId = useMemo(() => {
    const map: Record<string, any[]> = {};
    const order: string[] = [];
    items?.forEach((item: any) => {
      const id = item.orderId;
      if (!map[id]) {
        map[id] = [];
        order.push(id);
      }
      map[id].push(item);
    });
    return { map, order };
  }, [items]);

  return (
    <div>
      <div className="text-sm font-medium mb-2 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Package2 className="h-4 w-4" />
          <span>Items</span>
          <Badge variant="outline" className="ml-2">
            {items?.length || 0}
          </Badge>
        </div>
        <Button
          variant="outline"
          className="cursor-pointer group"
          onClick={(e: any) => {
            e.preventDefault();
            resetScans();
            e.target?.blur();
          }}
        >
          <RefreshCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
        </Button>
      </div>

      <div
        className={cn(
          "rounded-md border transition-all duration-300",
          scanReady &&
            "ring-4 ring-yellow-500/30 border-yellow-500/50 dark:bg-yellow-950/10",
          lotReady &&
            scanReady &&
            "ring-4 ring-green-500/30 border-green-500/50 bg-green-50/50 dark:bg-green-950/10",
        )}
      >
        {items?.length === 0 ? (
          <ul className="divide-y">
            <li className="w-full flex justify-center items-center p-6">
              <p className="text-sm text-muted-foreground">No items found</p>
            </li>
          </ul>
        ) : (
          itemsByOrderId.order.map((orderId, index) => (
            <div key={orderId}>
              {itemsByOrderId.order.length > 1 && (
                <div
                  className={cn(
                    "px-4 py-2 bg-muted/50 border-b font-medium text-sm text-muted-foreground",
                    index !== 0 && "border-y",
                  )}
                >
                  Order <span className="font-bold">#{orderId}</span>
                </div>
              )}
              <ul className="divide-y">
                {itemsByOrderId.map[orderId].map((item: any) => {
                  const itemKey = getItemKey(item);
                  const scanned = scannedCounts[itemKey] || 0;
                  const itemLots = lotNumbers[itemKey] ?? [];
                  const isExpanded = expandedItems[itemKey] ?? true;
                  const sharedLot = sharedLotNumbers[itemKey] || "";

                  return (
                    <li
                      key={itemKey}
                      className={cn("hover:bg-accent/50 transition-colors")}
                    >
                      <div className="p-4 flex items-center gap-4">
                        <div
                          className={cn(
                            "bg-primary/10 rounded-full p-3 shrink-0",
                            scanReady && "bg-yellow-500/20",
                            lotReady && scanReady && "bg-green-500/20",
                          )}
                        >
                          <span
                            className={cn(
                              "font-bold text-primary",
                              scanReady &&
                                "text-yellow-600 dark:text-yellow-500",
                              lotReady &&
                                scanReady &&
                                "text-green-600 dark:text-green-500",
                            )}
                          >
                            {item.packageId ?? "N/A"}
                          </span>
                        </div>
                        <div className="grow">
                          <p className="font-medium text-sm md:text-base line-clamp-2 text-balance">
                            {item.description ?? "N/A"}
                          </p>

                          {(scanned > 0 || itemLots.length > 0) && (
                            <Accordion
                              type="single"
                              collapsible
                              className="w-full mt-2"
                              value={isExpanded ? `lot-${itemKey}` : ""}
                              onValueChange={(value) => {
                                setExpandedItems((prev) => ({
                                  ...prev,
                                  [itemKey]: value === `lot-${itemKey}`,
                                }));
                              }}
                            >
                              <AccordionItem
                                value={`lot-${itemKey}`}
                                className="border-none"
                              >
                                <AccordionTrigger className="py-1 text-xs text-muted-foreground">
                                  LOT Numbers (
                                  {
                                    itemLots.filter((l) => l.lotNumber.trim())
                                      .length
                                  }
                                  /
                                  {Math.max(
                                    scanned,
                                    itemLots.length,
                                    item.quantity,
                                  )}{" "}
                                  entered, min: {item.quantity}, max:{" "}
                                  {item.quantity + 10})
                                </AccordionTrigger>
                                <AccordionContent>
                                  {(scanned > 1 || itemLots.length > 1) && (
                                    <div className="flex items-center gap-2 mb-3 p-2 bg-muted/30 rounded-md">
                                      <Label className="text-xs whitespace-nowrap">
                                        Same LOT for all:
                                      </Label>
                                      <div className="grow flex items-center gap-2">
                                        <Input
                                          size={1}
                                          placeholder="Enter LOT"
                                          value={sharedLot}
                                          disabled={readyToPicture}
                                          onChange={(e) =>
                                            handleSharedLotChange(
                                              itemKey,
                                              e.target.value,
                                            )
                                          }
                                          className={cn("h-8 text-xs grow")}
                                        />
                                        <Button
                                          size="sm"
                                          variant={
                                            !sharedLot.trim()
                                              ? "secondary"
                                              : "default"
                                          }
                                          className="h-8 px-2"
                                          disabled={
                                            readyToPicture || !sharedLot.trim()
                                          }
                                          onClick={(e: any) => {
                                            e.preventDefault();
                                            applySharedLot(itemKey);
                                            e.target?.blur();
                                          }}
                                        >
                                          <Copy className="h-3.5 w-3.5 mr-1" />
                                          Apply
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  <div className="grid gap-2">
                                    {Array.from({
                                      length: Math.max(
                                        scanned,
                                        itemLots.length,
                                      ),
                                    }).map((_, idx) => {
                                      const lotEntry = itemLots.find(
                                        (l) => l.scanIndex === idx,
                                      );
                                      const lotNumber =
                                        lotEntry?.lotNumber || "";

                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2 px-1 mt-1"
                                        >
                                          <Label className="text-xs w-16">
                                            LOT {idx + 1}:
                                          </Label>
                                          <div className="grow flex items-center gap-2">
                                            <Input
                                              size={1}
                                              placeholder="Enter LOT number"
                                              value={lotNumber}
                                              disabled={readyToPicture}
                                              onChange={(e) =>
                                                handleLotNumberChange(
                                                  itemKey,
                                                  idx,
                                                  e.target.value,
                                                )
                                              }
                                              className="h-8 text-xs"
                                            />
                                            {idx >=
                                              Math.max(
                                                scanned,
                                                item.quantity,
                                              ) &&
                                              itemLots.length >
                                                item.quantity && (
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-8 w-8 cursor-pointer"
                                                  disabled={readyToPicture}
                                                  onClick={(e: any) => {
                                                    e.preventDefault();
                                                    // Remove this lot entry (min: quantity)
                                                    setLotNumbers((prev) => {
                                                      const itemLots = [
                                                        ...(prev[itemKey] ||
                                                          []),
                                                      ];

                                                      // Don't allow removing if we're at minimum quantity
                                                      if (
                                                        itemLots.length <=
                                                        item.quantity
                                                      )
                                                        return prev;

                                                      const filteredLots =
                                                        itemLots.filter(
                                                          (entry) =>
                                                            entry.scanIndex !==
                                                            idx,
                                                        );
                                                      // Reindex remaining lots
                                                      const reindexedLots =
                                                        filteredLots.map(
                                                          (entry, newIdx) => ({
                                                            ...entry,
                                                            scanIndex:
                                                              entry.scanIndex >
                                                              idx
                                                                ? entry.scanIndex -
                                                                  1
                                                                : entry.scanIndex,
                                                          }),
                                                        );
                                                      return {
                                                        ...prev,
                                                        [itemKey]:
                                                          reindexedLots,
                                                      };
                                                    });
                                                    e.target?.blur();
                                                  }}
                                                >
                                                  <XCircle className="h-3.5 w-3.5 stroke-destructive" />
                                                </Button>
                                              )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {scanned >= item.quantity && (
                                      <div className="flex justify-center mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 px-3 cursor-pointer"
                                          disabled={
                                            readyToPicture ||
                                            itemLots.length >=
                                              item.quantity + 10
                                          }
                                          onClick={(e: any) => {
                                            e.preventDefault();
                                            // Add new lot entry (max: quantity + 10)
                                            setLotNumbers((prev) => {
                                              const itemLots = [
                                                ...(prev[itemKey] || []),
                                              ];
                                              const maxLots =
                                                item.quantity + 10;

                                              if (itemLots.length >= maxLots)
                                                return prev;

                                              const newIndex = Math.max(
                                                scanned,
                                                itemLots.length,
                                              );
                                              return {
                                                ...prev,
                                                [itemKey]: [
                                                  ...itemLots,
                                                  {
                                                    scanIndex: newIndex,
                                                    lotNumber: "",
                                                  },
                                                ],
                                              };
                                            });
                                            e.target?.blur();
                                          }}
                                        >
                                          <Plus className="h-3.5 w-3.5" />
                                          Add LOT
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                          {/* {scanned === 0 && itemLots.length === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={readyToPicture}
                        onClick={(e: any) => {
                          e.preventDefault();
                          // Add minimum quantity LOT entries without scanning
                          setLotNumbers((prev) => {
                            const minLots = Array.from({
                              length: item.quantity,
                            }).map((_, idx) => ({
                              scanIndex: idx,
                              lotNumber: "",
                            }));
                            return {
                              ...prev,
                              [itemKey]: minLots,
                            };
                          });
                          // Expand the accordion
                          setExpandedItems((prev) => ({
                            ...prev,
                            [itemKey]: true,
                          }));
                          e.target?.blur();
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add LOT
                      </Button>
                    )} */}
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                "text-lg font-bold px-3 py-1.5",
                                scanReady && "bg-yellow-500 text-white",
                                lotReady &&
                                  scanReady &&
                                  "bg-green-500 text-white",
                              )}
                            >
                              x{item.quantity ?? "N/A"}
                            </Badge>

                            {isComplete(itemKey, item.quantity) ? (
                              <div
                                className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-full",
                                  scanReady && "bg-yellow-500 text-white",
                                  lotReady &&
                                    scanReady &&
                                    "bg-green-500 text-white",
                                )}
                              >
                                <Check className="h-5 w-5" />
                              </div>
                            ) : readyToPicture ? (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white">
                                <Check className="h-5 w-5" />
                              </div>
                            ) : packagesBarcodes.find(
                                (p) =>
                                  p.pwPackageId ===
                                  (item.legacyId ?? item.packageId),
                              ) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={(e: any) => {
                                  e.preventDefault();
                                  handleScan(item.legacyId ?? item.packageId);
                                }}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={(e: any) => {
                                  e.preventDefault();
                                  handleScan(item.legacyId ?? item.packageId);
                                }}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="w-full flex items-center gap-2 text-xs">
                            <Progress
                              value={getProgress(itemKey, item.quantity)}
                              className={cn(
                                "h-2",
                                scanReady &&
                                  "bg-yellow-100 [&>div]:bg-yellow-500",
                                lotReady &&
                                  scanReady &&
                                  "bg-green-100 [&>div]:bg-green-500",
                              )}
                            />
                            <span
                              className={cn(
                                "text-muted-foreground whitespace-nowrap",
                                scanReady &&
                                  "text-yellow-600 dark:text-yellow-500",
                                lotReady &&
                                  scanReady &&
                                  "text-green-600 dark:text-green-500",
                              )}
                            >
                              {scanned}/{item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="mt-2.5 flex justify-between items-center gap-2">
        <Button
          variant="outline"
          onClick={(e: any) => {
            e.preventDefault();
            setReadyToPicture(false);
          }}
          className="w-full group cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white hover:text-white"
          disabled={!readyToPicture}
        >
          <EditIcon className="min-h-6 min-w-6 mr-2 cursor-pointer" />
          Edit
        </Button>
        <Button
          variant="outline"
          onClick={(e: any) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="w-full group cursor-pointer bg-green-600 hover:bg-green-500 text-white hover:text-white"
          disabled={readyToPicture}
        >
          <CheckCheck className="min-h-6 min-w-6 mr-2" />
          OK, Continue
        </Button>
      </div>

      {/* Warning Dialog for Incomplete Scans */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Incomplete Scanning
            </DialogTitle>
            <DialogDescription>
              The following items have not been fully scanned:
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-auto">
            <ul className="space-y-2">
              {incompleteItems.map((item) => (
                <li
                  key={getItemKey(item)}
                  className="flex justify-between items-center p-2 border rounded-md"
                >
                  <div>
                    <p className="font-medium">{item.packageId}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-destructive font-medium">
                    {scannedCounts[getItemKey(item)] || 0}/{item.quantity}{" "}
                    scanned
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWarningDialog(false)}
              className="cursor-pointer"
            >
              Continue Scanning
            </Button>
            {/* <Button
              variant="destructive"
              onClick={() => {
                setShowWarningDialog(false);

                const missingLots = checkMissingLotNumbers();
                if (missingLots.length > 0) {
                  setItemsWithMissingLots(missingLots);
                  setShowLotWarningDialog(true);
                  return;
                }
                setReadyToPicture(true);
                setResult({ scannedCounts, lotNumbers });
              }}
            >
              Submit Anyway
            </Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog for Missing LOT Numbers */}
      <WarningMissingLotDialog
        open={showLotWarningDialog}
        setOpen={setShowLotWarningDialog}
        itemsWithMissingLots={itemsWithMissingLots}
        scannedCounts={scannedCounts}
        lotNumbers={lotNumbers}
        sharedLotNumbers={sharedLotNumbers}
        handleSharedLotChange={handleSharedLotChange}
        applySharedLot={applySharedLot}
        handleLotNumberChange={handleLotNumberChange}
        getItemKey={getItemKey}
        readyToPicture={readyToPicture}
        setReadyToPicture={setReadyToPicture}
        setResult={setResult}
      />

      <OverScanItemDialog
        open={showOverScanDialog}
        setOpen={setShowOverScanDialog}
        currentOverScanItem={currentOverScanItem}
        scannedCounts={scannedCounts}
        getItemKey={getItemKey}
      />

      <WrongItemDialog
        open={showWrongItemDialog}
        setOpen={setShowWrongItemDialog}
        scannedBarcode={barcode}
        items={items}
        packagesBarcodes={packagesBarcodes}
      />
    </div>
  );
}
