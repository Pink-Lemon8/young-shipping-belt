import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilterX } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { beltQueueStatusTypes } from "@/db/schema";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  parseProcessViewItemStatus,
  processViewItemStatusOptions,
} from "@/lib/process-view-item-status";

type ProcessViewFilterProps = {
  loading?: boolean;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  currentPage?: number;
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
};

/** Process view is fixed to belt C (matches server `process-view/page.tsx`). */
const FIXED_BELT_CODE = "C";

export default function ProcessViewFilter({
  loading,
  setLoading,
  currentPage,
  setCurrentPage,
}: ProcessViewFilterProps) {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") || "ANY");
  const [itemStatus, setItemStatus] = useState(() =>
    parseProcessViewItemStatus(searchParams.get("itemStatus")),
  );

  const [isSkipped, setIsSkipped] = useState(
    searchParams.get("isSkipped") === "true" || false,
  );
  const [isLocked, setIsLocked] = useState(
    searchParams.get("isLocked") === "true" || false,
  );
  const [reviewCountLessThan, setReviewCountLessThan] = useState(
    searchParams.get("reviewCountLessThan") === "true" || false,
  );
  const [reviewCountLessThanValue, setReviewCountLessThanValue] = useState(
    () => {
      const rcLt = searchParams.get("reviewCountLessThan") === "true";
      const raw = searchParams.get("reviewCountLessThanValue");
      if (!rcLt) return 2;
      const n = raw != null && raw !== "" ? Number(raw) : NaN;
      return Number.isFinite(n) ? n : 2;
    },
  );

  const parseDate = (s: string | null): Date | undefined => {
    if (!s) return undefined;
    const d = new Date(s + "T12:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  };

  const [shipDateFrom, setShipDateFrom] = useState<Date | undefined>(
    parseDate(searchParams.get("shipDateFrom")),
  );
  const [shipDateTo, setShipDateTo] = useState<Date | undefined>(
    parseDate(searchParams.get("shipDateTo")),
  );

  const router = useRouter();

  const updateUrlParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "ANY") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const urlString = `?${params.toString()}`;
    router.push(urlString);
    router.refresh();
  };

  const applyFilters = () => {
    updateUrlParams({
      beltCode: FIXED_BELT_CODE,
      status: status === "ANY" ? undefined : status,
      itemStatus: itemStatus === "ANY" ? undefined : itemStatus,
      page: "1",
      isSkipped: isSkipped ? isSkipped.toString() : undefined,
      isLocked: isLocked ? isLocked.toString() : undefined,
      reviewCountLessThan: reviewCountLessThan ? "true" : undefined,
      reviewCountLessThanValue: reviewCountLessThan
        ? String(reviewCountLessThanValue)
        : undefined,
      shipDateFrom: shipDateFrom ? format(shipDateFrom, "yyyy-MM-dd") : undefined,
      shipDateTo: shipDateTo ? format(shipDateTo, "yyyy-MM-dd") : undefined,
    });
    setCurrentPage?.(1);
  };

  const clearFilters = () => {
    setStatus("ANY");
    setItemStatus("ANY");
    setIsSkipped(false);
    setIsLocked(false);
    setReviewCountLessThan(false);
    setReviewCountLessThanValue(2);
    setShipDateFrom(undefined);
    setShipDateTo(undefined);
    setCurrentPage?.(1);
    updateUrlParams({
      beltCode: FIXED_BELT_CODE,
      status: undefined,
      itemStatus: undefined,
      page: "1",
      isSkipped: undefined,
      isLocked: undefined,
      reviewCountLessThan: undefined,
      reviewCountLessThanValue: undefined,
      shipDateFrom: undefined,
      shipDateTo: undefined,
    });
  };

  const activeFilterCount = [
    status !== "ANY",
    itemStatus !== "ANY",
    isSkipped,
    isLocked,
    reviewCountLessThan,
    !!(shipDateFrom || shipDateTo),
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const activeFilterRing =
    "border-primary ring-2 ring-primary/20 shadow-[0_2px_10px_-3px_color-mix(in_oklch,var(--primary)_26%,transparent)]";

  // Sync state from URL (e.g. browser back/forward or shared link)
  useEffect(() => {
    setShipDateFrom(parseDate(searchParams.get("shipDateFrom")));
    setShipDateTo(parseDate(searchParams.get("shipDateTo")));
    setItemStatus(parseProcessViewItemStatus(searchParams.get("itemStatus")));
    const rcLt = searchParams.get("reviewCountLessThan") === "true";
    const rawVal = searchParams.get("reviewCountLessThanValue");
    setReviewCountLessThan(rcLt);
    if (rcLt) {
      const n =
        rawVal != null && rawVal !== "" ? Number(rawVal) : Number.NaN;
      setReviewCountLessThanValue(Number.isFinite(n) ? n : 2);
    } else {
      setReviewCountLessThanValue(2);
    }
  }, [
    searchParams.get("shipDateFrom"),
    searchParams.get("shipDateTo"),
    searchParams.get("itemStatus"),
    searchParams.get("reviewCountLessThan"),
    searchParams.get("reviewCountLessThanValue"),
  ]);

  useEffect(() => {
    setLoading?.(true);
    applyFilters();
  }, [status, itemStatus, isSkipped, isLocked, reviewCountLessThan, reviewCountLessThanValue, shipDateFrom, shipDateTo]);

  return (
    <Card className="border border-border/80 bg-card shadow-sm rounded-lg overflow-hidden w-full min-w-0">
      <CardContent className="p-3 sm:p-4 md:py-4 md:px-5 lg:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:gap-x-4 md:gap-y-4 lg:gap-x-5">
          {/* Primary filters: Status, Ship date — belt fixed to C */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:flex md:flex-wrap md:items-end md:gap-x-4 md:gap-y-0 lg:gap-x-5 min-w-0">
            <div className="space-y-1.5 min-w-0 w-full md:w-[168px] lg:w-[180px]">
              <Label
                htmlFor="filter-status"
                className="text-xs font-medium text-muted-foreground tracking-tight"
              >
                Processing status
              </Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  if (!["ANY", "STAGE1"].includes(value)) setIsSkipped(false);
                }}
              >
                <SelectTrigger
                  id="filter-status"
                  className={cn(
                    "h-9 w-full min-w-0 border-input/80 bg-background font-medium touch-manipulation",
                    status !== "ANY" && activeFilterRing,
                  )}
                >
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">Any status</SelectItem>
                  {beltQueueStatusTypes.map((statusType) => (
                    <SelectItem key={statusType} value={statusType}>
                      {statusType.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 min-w-0 w-full md:w-[180px] lg:w-[200px]">
              <Label
                htmlFor="filter-item-status"
                className="text-xs font-medium text-muted-foreground tracking-tight"
              >
                Item status
              </Label>
              <Select
                value={itemStatus}
                onValueChange={(value) =>
                  setItemStatus(parseProcessViewItemStatus(value))
                }
              >
                <SelectTrigger
                  id="filter-item-status"
                  className={cn(
                    "h-9 w-full min-w-0 border-input/80 bg-background font-medium touch-manipulation",
                    itemStatus !== "ANY" && activeFilterRing,
                  )}
                >
                  <SelectValue placeholder="Any item status" />
                </SelectTrigger>
                <SelectContent>
                  {processViewItemStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className={cn(
                "space-y-1.5 min-w-0 w-full sm:col-span-2 md:col-span-1 md:w-[200px] lg:w-[220px]",
                (isSkipped || isLocked) && "pointer-events-none opacity-50",
              )}
            >
              <Label className="text-xs font-medium text-muted-foreground tracking-tight">
                Ship date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isSkipped || isLocked}
                    className={cn(
                      "h-9 w-full min-w-0 justify-start text-left font-normal border-input/80 bg-background shadow-xs touch-manipulation",
                      !shipDateFrom && !shipDateTo && "text-muted-foreground",
                      (shipDateFrom || shipDateTo) && activeFilterRing,
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    {shipDateFrom && shipDateTo ? (
                      <span className="truncate">
                        {format(shipDateFrom, "dd MMM yyyy")} –{" "}
                        {format(shipDateTo, "dd MMM yyyy")}
                      </span>
                    ) : shipDateFrom ? (
                      <span className="truncate">
                        {format(shipDateFrom, "dd MMM yyyy")} – …
                      </span>
                    ) : (
                      <span className="truncate">Pick date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" sideOffset={4}>
                  <Calendar
                    mode="range"
                    defaultMonth={shipDateFrom ?? shipDateTo ?? new Date()}
                    selected={
                      shipDateFrom || shipDateTo
                        ? ({
                          from: shipDateFrom ?? undefined,
                          to: shipDateTo ?? undefined,
                        } as DateRange)
                        : undefined
                    }
                    onSelect={(range: DateRange | undefined) => {
                      if (range?.from) {
                        setShipDateFrom(range.from);
                        setShipDateTo(range.to ?? range.from);
                      } else {
                        setShipDateFrom(undefined);
                        setShipDateTo(undefined);
                      }
                    }}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Toggle filters — wraps on small screens, single row on large */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-2.5 sm:px-4 sm:py-2.5 md:shrink-0 min-w-0">
            <div
              className={cn(
                "flex items-center gap-2 min-h-9 rounded-md px-2 py-1 -my-0.5 transition-[box-shadow,border-color]",
                isSkipped && activeFilterRing,
              )}
            >
              <Switch
                checked={isSkipped}
                onCheckedChange={(checked) => {
                  setStatus("ANY");
                  setIsSkipped(checked);
                  setIsLocked(false);
                  if (checked) {
                    setShipDateFrom(undefined);
                    setShipDateTo(undefined);
                  }
                }}
                disabled={!["ANY", "STAGE1"].includes(status)}
                className="data-[state=checked]:bg-primary shrink-0"
                name="isSkipped"
                id="isSkipped"
              />
              <Label
                htmlFor="isSkipped"
                className={cn(
                  "cursor-pointer text-xs sm:text-sm font-medium text-foreground/90 whitespace-nowrap transition-colors select-none touch-manipulation",
                  !["ANY", "STAGE1"].includes(status) &&
                  "text-muted-foreground/60 cursor-not-allowed",
                )}
              >
                Skipped
              </Label>
            </div>
            <div className="hidden sm:block h-4 w-px bg-border/80 shrink-0" aria-hidden />
            <div
              className={cn(
                "flex items-center gap-2 min-h-9 rounded-md px-2 py-1 -my-0.5 transition-[box-shadow,border-color]",
                isLocked && activeFilterRing,
              )}
            >
              <Switch
                checked={isLocked}
                onCheckedChange={(checked) => {
                  setStatus("ANY");
                  setIsSkipped(false);
                  setIsLocked(checked);
                  if (checked) {
                    setShipDateFrom(undefined);
                    setShipDateTo(undefined);
                  }
                }}
                className="data-[state=checked]:bg-primary shrink-0"
                name="isLockedForUser"
                id="isLockedForUser"
              />
              <Label
                htmlFor="isLockedForUser"
                className="cursor-pointer text-xs sm:text-sm font-medium text-foreground/90 whitespace-nowrap select-none touch-manipulation"
              >
                Locked
              </Label>
            </div>
            <div className="hidden sm:block h-4 w-px bg-border/80 shrink-0" aria-hidden />
            <div
              className={cn(
                "flex items-center gap-2 min-h-9 rounded-md px-2 py-1 -my-0.5 transition-[box-shadow,border-color]",
                reviewCountLessThan && activeFilterRing,
              )}
            >
              <Switch
                checked={reviewCountLessThan}
                onCheckedChange={setReviewCountLessThan}
                className="data-[state=checked]:bg-primary shrink-0"
                name="reviewCountLessThan2"
                id="reviewCountLessThan2"
              />
              &lt;{" "}
              <Select
                value={reviewCountLessThanValue.toString()}
                onValueChange={(value) =>
                  setReviewCountLessThanValue(Number(value))
                }
                disabled={!reviewCountLessThan}
              >
                <SelectTrigger
                  isIconShow={false}
                  disabled={!reviewCountLessThan}
                  className={cn(
                    "h-8 w-10 min-w-0 border-input/80 bg-background font-medium px-0 justify-center touch-manipulation",
                    reviewCountLessThan
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50",
                  )}
                >
                  {reviewCountLessThanValue}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="2">2 reviews</SelectItem>
                  <SelectItem value="3">3 reviews</SelectItem>
                  <SelectItem value="4">4 reviews</SelectItem>
                  <SelectItem value="5">5 reviews</SelectItem>
                </SelectContent>
              </Select>
              <Label
                htmlFor="reviewCountLessThan2"
                className="cursor-pointer text-xs sm:text-sm font-medium text-foreground/90 whitespace-nowrap select-none touch-manipulation"
              >
                Review{reviewCountLessThanValue > 1 ? "s" : ""}
              </Label>
            </div>
          </div>

          {hasActiveFilters ? (
            <>
              <Separator
                orientation="vertical"
                className="hidden md:block h-9 bg-border shrink-0 self-center"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                aria-label={`Reset ${activeFilterCount} active filter${activeFilterCount !== 1 ? "s" : ""}`}
                className="h-9 gap-2 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0 font-medium w-full md:w-auto touch-manipulation justify-center md:justify-start mb-3"
              >
                <FilterX className="h-4 w-4 shrink-0" />
                <span className="relative inline-block pr-1">
                  Reset
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-0 top-0 translate-x-[70%] -translate-y-[55%] flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary/80 px-0.5 text-[10px] font-bold tabular-nums leading-none text-primary-foreground shadow-sm ring-2 ring-background"
                  >
                    {activeFilterCount}
                  </span>
                </span>
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
