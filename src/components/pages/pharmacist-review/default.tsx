"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CopyIcon,
  Loader2,
  MousePointerClickIcon,
  Package,
  XIcon,
} from "lucide-react";
import { format, getYear, startOfDay, subDays } from "date-fns";
import { Result } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PharmacistReviewData from "./data";
import ManualForm from "./data/manual/form";
import PharmacistReviewError from "./error";
import { pullQueueForReview } from "./action";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

const PHARMACIST_FROM_DATE_RANGE_DAYS = 7;

function getPickerDateBounds() {
  const todayStart = startOfDay(new Date());
  const pickerFromDate = startOfDay(
    subDays(todayStart, PHARMACIST_FROM_DATE_RANGE_DAYS - 1),
  );
  const pickerToDate = todayStart;
  return { pickerFromDate, pickerToDate };
}

function clampToPickerRange(d: Date, from: Date, to: Date): Date {
  const t = startOfDay(d).getTime();
  const min = startOfDay(from).getTime();
  const max = startOfDay(to).getTime();
  if (t < min) return new Date(min);
  if (t > max) return new Date(max);
  return startOfDay(d);
}

export default function PharmacistReviewDefault({
  notDrugPackages = [],
  children,
}: {
  children?: React.ReactNode;
  notDrugPackages?: string[] | undefined;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [filterFromDate, setFilterFromDate] = useState(() =>
    startOfDay(new Date()),
  );

  const [manualOpen, setManualOpen] = useState<boolean>(false);

  const [loadingManual, setLoadingManual] = useState<boolean>(false);
  const [manualResult, setManualResult] = useState<Result | undefined>(
    undefined,
  );

  const [loading, setLoading] = useState<boolean>(false);

  const [result, setResult] = useState<Result | undefined>(undefined);
  const [processed, setProcessed] = useState<Result | undefined>(undefined);
  const lastHandledOrderIdRef = useRef<string | null>(null);

  const { pickerFromDate, pickerToDate } = getPickerDateBounds();
  const effectiveFromDate = clampToPickerRange(
    filterFromDate,
    pickerFromDate,
    pickerToDate,
  );
  const isFilterToday =
    format(effectiveFromDate, "yyyy-MM-dd") ===
    format(startOfDay(new Date()), "yyyy-MM-dd");
  const filterFromDateKey = format(effectiveFromDate, "yyyy-MM-dd");

  const orderIdParam = searchParams.get("orderId")?.trim() ?? "";

  const queueUiPending = loading;

  /** Drop legacy ?fromDate= — filter lives in state only. */
  useEffect(() => {
    if (!searchParams.get("fromDate")) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("fromDate");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [pathname, router, searchParams]);

  const fetchBeltQueue = async (
    fetchResult: boolean = false,
    orderId: string | undefined = undefined,
    groupedOrderIds: string[] | undefined = undefined,
    activeOrderGroupId: number | undefined = undefined,
    isBuffer: boolean = false,
    fromDate: Date | undefined = undefined,
    limit: number = 5,
    offset: number = 0,
  ) => {
    if (!isBuffer) setLoading(true);
    const queueResult = await pullQueueForReview(
      orderId ? [orderId] : undefined,
      groupedOrderIds,
      activeOrderGroupId,
      fromDate ? { fromDate: fromDate } : undefined,
      limit,
      offset,
    );
    if (fetchResult) setResult(queueResult);
    if (!isBuffer) setLoading(false);
    return queueResult;
  };

  const norm = (id: any) =>
    id == null || id === "" || id === "-1"
      ? null
      : Number.isNaN(Number(id))
        ? id
        : Number(id);

  const handleProcessed = async (processedResult: Result) => {
    const orderId = processedResult?.value?.orderId;
    const newQueue: Array<any> = result?.value?.queue?.filter(
      (order: any) => order.orderId !== orderId,
    );

    if (newQueue?.length === 1) {
      const newResult = await fetchBeltQueue(
        false,
        undefined,
        result?.value?.groupedQueue?.map((o: any) => o.orderId),
        undefined,
        true,
        effectiveFromDate,
        4,
        1,
      );
      if (newResult?.status === "success") {
        newQueue.push(...(newResult?.value?.queue ?? []));
        const keptOrderGroupIds = new Set(
          newQueue
            .map((o: any) => norm(o.groupId))
            .filter((id): id is number => id != null),
        );
        const existingGroupedForKeptOrders =
          result?.value?.groupedQueue?.filter((o: any) => {
            const g = norm(o.groupId);
            return g != null && keptOrderGroupIds.has(g);
          }) ?? [];
        const newGroupedQueue = newResult?.value?.groupedQueue ?? [];
        const mainOrderIds = new Set(newQueue.map((o: any) => o.orderId));
        const mergedGroupedQueue = [
          ...existingGroupedForKeptOrders,
          ...newGroupedQueue,
        ].filter((o: any) => !mainOrderIds.has(o.orderId));
        setResult({
          ...newResult,
          value: {
            queue: newQueue,
            groupedQueue: mergedGroupedQueue,
            length: newResult?.value?.length,
          },
        });
      } else {
        const keptGroupIds = new Set(
          newQueue
            .map((o: any) => norm(o.groupId))
            .filter((id): id is number => id != null),
        );
        const fallbackGrouped =
          result?.value?.groupedQueue?.filter((o: any) => {
            const g = norm(o.groupId);
            return g != null && keptGroupIds.has(g);
          }) ?? [];
        setResult((prev) => ({
          status: "success",
          ...prev,
          value: {
            queue: newQueue,
            groupedQueue: fallbackGrouped,
            length: 1,
          },
        }));
      }
    } else if (newQueue?.length === 0) {
      setResult({
        status: "error",
        messages: ["No more orders in queue"],
      });
    } else {
      setResult((prev) => ({
        status: "success",
        ...prev,
        value: {
          queue: newQueue,
          groupedQueue: prev?.value?.groupedQueue,
          length: (prev?.value?.length ?? 1) - 1,
        },
      }));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (manualResult) {
      setLoadingManual(false);
    }
  }, [manualResult]);

  useEffect(() => {
    if (
      processed?.status === "success" &&
      processed?.value?.orderId != null &&
      lastHandledOrderIdRef.current !== processed.value.orderId
    ) {
      lastHandledOrderIdRef.current = processed.value.orderId;
      handleProcessed(processed);
    }
  }, [processed?.value]);

  useEffect(() => {
    const fromDate = effectiveFromDate;
    setProcessed(undefined);
    lastHandledOrderIdRef.current = null;

    if (orderIdParam !== "") {
      void fetchBeltQueue(
        true,
        orderIdParam,
        undefined,
        undefined,
        false,
        fromDate,
        1,
        0,
      );
      return;
    }

    void fetchBeltQueue(true, undefined, undefined, undefined, false, fromDate, 5, 0);
  }, [orderIdParam, filterFromDateKey]);

  return (
    <section className="relative">
      <div className="mx-auto p-4 max-w-7xl">
        <Card className="w-full mb-6 overflow-hidden border-none shadow-sm">
          <CardContent
            className={cn(
              "p-0",
              queueUiPending ? "animate-pulse animate-infinite" : "",
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0">
              <div className="p-4 md:col-span-2">
                <div className="flex items-center flex-wrap gap-8">
                  {result?.status === "success" && !queueUiPending && (
                    <>
                      <div className="font-semibold">
                        <p className="text-xs text-muted-foreground">
                          Batch ID
                        </p>
                        <p className="font-semibold">
                          {result?.value?.queue[0]?.batchId || "N/A"}
                        </p>
                      </div>

                      <div className="font-semibold">
                        {manualOpen === false && (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p
                                  className="text-xs text-muted-foreground flex items-center gap-2 group cursor-pointer"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      result?.value?.queue?.[0]?.orderId ?? "",
                                    );
                                    toast.success(
                                      <>
                                        order ID
                                        <span className="font-semibold text-green-600 ml-1">
                                          #
                                          {result?.value?.queue?.[0]?.orderId ??
                                            ""}
                                        </span>{" "}
                                        copied to clipboard
                                      </>,
                                    );
                                  }}
                                >
                                  Current Order
                                  <CopyIcon className="h-5 w-5 group-hover:text-green-600 transition-all" />
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy order ID to clipboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {manualOpen ? (
                          <div className="relative ml-4">
                            <ManualForm
                              open={manualOpen}
                              setOpen={setManualOpen}
                              setResult={setManualResult}
                            />
                            <Button
                              variant="ghost"
                              className="absolute -left-10 top-0 p-2 text-red-600 hover:text-red-700"
                              onClick={async () => {
                                setManualOpen(false);
                                setLoadingManual(false);
                                router.push("/pharmacist-review");
                                await fetchBeltQueue(
                                  true,
                                  undefined,
                                  result?.value?.groupedQueue?.map(
                                    (o: any) => o.orderId,
                                  ),
                                  result?.value?.queue?.[0]?.groupId ??
                                  undefined,
                                  false,
                                  effectiveFromDate,
                                  5,
                                  0,
                                );
                              }}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            {result?.value?.queue[0]?.groupId ? (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className="flex flex-row items-center font-semibold cursor-pointer group"
                                      onClick={() => {
                                        setManualOpen((prev) => !prev);
                                        setLoadingManual(true);
                                      }}
                                    >
                                      G-{result?.value?.queue[0]?.groupId}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <p>
                                      {(() => {
                                        const mainOrderId =
                                          result?.value?.queue[0]?.orderId;
                                        const groupId =
                                          result?.value?.queue[0]?.groupId;
                                        const nid = norm(groupId);
                                        if (nid == null) return mainOrderId ?? "—";
                                        const fromGroup =
                                          result?.value?.groupedQueue?.filter(
                                            (o: any) =>
                                              norm(o.groupId) === nid &&
                                              o.orderId != null &&
                                              String(o.orderId).trim() !== "",
                                          ) ?? [];
                                        const orderIds = [
                                          ...new Set([
                                            mainOrderId,
                                            ...fromGroup.map(
                                              (o: any) => o.orderId,
                                            ),
                                          ].filter(Boolean)),
                                        ];
                                        return orderIds.join(", ");
                                      })()}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <p>{result?.value?.queue[0]?.orderId}</p>
                            )}
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="flex flex-row items-center font-semibold cursor-pointer group"
                                    onClick={() => {
                                      setManualOpen((prev) => !prev);
                                      setLoadingManual(true);
                                    }}
                                  >
                                    <MousePointerClickIcon className="h-5 w-5 ml-2 group-hover:text-green-600 transition-all" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <p>Click to open manual entry</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                      {!manualOpen ? (
                        <div className="flex flex-col gap-1 font-semibold">
                          <Label
                            htmlFor="from-date"
                            className="text-xs font-semibold text-muted-foreground"
                          >
                            Filter queue from
                          </Label>
                          <div className="flex max-w-[240px] flex-col gap-1">
                            <DatePicker
                              value={effectiveFromDate}
                              onChange={(d) =>
                                setFilterFromDate(
                                  clampToPickerRange(
                                    d,
                                    pickerFromDate,
                                    pickerToDate,
                                  ),
                                )
                              }
                              disableWeekends
                              fromDate={pickerFromDate}
                              toDate={pickerToDate}
                              startYear={Math.min(
                                getYear(pickerFromDate),
                                getYear(pickerToDate),
                              )}
                              endYear={Math.max(
                                getYear(pickerFromDate),
                                getYear(pickerToDate),
                              )}
                              className={cn(
                                "h-9 w-full justify-start font-normal shadow-xs",
                                isFilterToday && "text-muted-foreground",
                              )}
                            />
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 flex items-center justify-between border-t md:border-l">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Orders in Queue
                    </p>
                    <p className="flex min-h-5 items-center font-semibold">
                      {queueUiPending ? (
                        <Loader2
                          className="h-5 w-5 animate-spin text-muted-foreground"
                          aria-label="Loading queue count"
                        />
                      ) : (
                        (result?.value?.length ?? 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {queueUiPending ? (
          <div className="flex justify-center items-center mt-5">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : (
          <></>
        )}
        {!queueUiPending && !loadingManual && result?.status === "success" ? (
          <PharmacistReviewData
            process={result?.value?.queue[0]}
            groupedProcess={result?.value?.groupedQueue?.filter(
              (o: any) => {
                const current = result?.value?.queue?.[0];
                if (!current?.orderId) return false;
                const currentGid = norm(current.groupId);
                const oGid = norm(o.groupId);
                const sameGroup =
                  currentGid != null &&
                  oGid != null &&
                  currentGid === oGid;
                return sameGroup && o.orderId !== current.orderId;
              },
            )}
            loading={loading}
            setLoading={setLoading}
            setResult={setProcessed}
            notDrugPackages={notDrugPackages}
          />
        ) : (
          <></>
        )}
        {!queueUiPending && !loadingManual && result?.status === "error" && (
          <PharmacistReviewError
            result={result}
            setLoading={setLoading}
            reFetch={(orderId?: string) => {
              fetchBeltQueue(
                true,
                orderId,
                undefined,
                undefined,
                false,
                effectiveFromDate,
                orderId ? 1 : 5,
                0,
              );
            }}
          />
        )}
        {children}
      </div>
    </section>
  );
}
