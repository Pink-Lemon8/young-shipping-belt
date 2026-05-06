import { Dialog } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type WarningMissingLotDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  itemsWithMissingLots: any[];
  scannedCounts: any;
  lotNumbers: any;
  sharedLotNumbers: any;
  handleSharedLotChange: (itemKey: string, lotNumber: string) => void;
  applySharedLot: (itemKey: string) => void;
  handleLotNumberChange: (
    itemKey: string,
    idx: number,
    lotNumber: string,
  ) => void;
  getItemKey: (item: { orderId?: string; packageId: string }) => string;
  readyToPicture: boolean;
  setReadyToPicture: (readyToPicture: boolean) => void;
  setResult: (result: any) => void;
};

export function WarningMissingLotDialog({
  open,
  setOpen,
  itemsWithMissingLots,
  scannedCounts,
  lotNumbers,
  sharedLotNumbers,
  handleSharedLotChange,
  applySharedLot,
  handleLotNumberChange,
  getItemKey,
  readyToPicture,
  setReadyToPicture,
  setResult,
}: WarningMissingLotDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-amber-500 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Missing LOT Numbers
          </DialogTitle>
          <DialogDescription>
            The following items have missing or incomplete LOT numbers:
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-auto">
          <ul className="space-y-2">
            {itemsWithMissingLots.map((item) => {
              const itemKey = getItemKey(item);
              const scanned = scannedCounts[itemKey] || 0;
              const itemLots = lotNumbers[itemKey] || [];
              const filledLots =
                itemLots.filter((l: any) => l.lotNumber.trim())?.length || 0;
              const sharedLot = sharedLotNumbers[itemKey] || "";

              return (
                <li key={itemKey} className="p-2 border rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.packageId}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-amber-600 font-medium">
                      {filledLots}/{scanned} LOT numbers
                    </div>
                  </div>

                  {scanned > 1 && (
                    <div className="flex items-center gap-2 mt-3 mb-2 p-2 bg-muted/30 rounded-md">
                      <Label className="text-xs whitespace-nowrap">
                        Same LOT for all:
                      </Label>
                      <div className="grow flex items-center gap-2">
                        <Input
                          size={1}
                          placeholder="Enter shared LOT number"
                          value={sharedLot}
                          onChange={(e) =>
                            handleSharedLotChange(itemKey, e.target.value)
                          }
                          className="h-8 text-xs grow"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 px-2"
                          onClick={() => applySharedLot(itemKey)}
                          disabled={!sharedLot.trim()}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 grid gap-2">
                    {Array.from({
                      length: Math.max(scanned, itemLots.length),
                    }).map((_, idx) => {
                      const lotEntry = itemLots.find(
                        (l: any) => l.scanIndex === idx,
                      );
                      const lotNumber = lotEntry?.lotNumber || "";

                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <Label className="text-xs w-16">LOT {idx + 1}:</Label>
                          <Input
                            size={1}
                            placeholder="Enter LOT number"
                            value={lotNumber}
                            onChange={(e) =>
                              handleLotNumberChange(
                                itemKey,
                                idx,
                                e.target.value,
                              )
                            }
                            className={cn(
                              "h-8 text-xs",
                              !lotNumber.trim() && "border-amber-500",
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            Complete LOT Numbers
          </Button>
          {/* <Button
                        variant="destructive"
                        onClick={() => {
                            setOpen(false)
                            setReadyToPicture(true)
                            setResult({ scannedCounts, lotNumbers })
                        }}
                    >
                        Submit Anyway
                    </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
