"use client";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import {
  CopyIcon,
  MousePointerClickIcon,
  Package,
  SkipForwardIcon,
  XIcon,
} from "lucide-react";
import { BeltSelect } from "../belt-select";
import { BeltBadge } from "../belt-badge";
import { Result } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import ManualForm from "../data/manual/form";
import SkipOrderModel from "../data/skip-order/skip-model";
import { useRouter } from "next/navigation";
import CheckLockFor from "../check-lock-for";
import { useToast } from "@/components/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type BeltHeaderProps = {
  loading: boolean;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  currentBeltCode: string;
  userBeltCode: string;
  result: Result | undefined;
  PushToStage2Today?: number;
};

export default function BeltHeader({
  loading,
  setLoading,
  currentBeltCode,
  userBeltCode,
  result,
  PushToStage2Today = 0,
}: BeltHeaderProps) {
  const [loadingManual, setLoadingManual] = useState<boolean>(false);
  const [manualResult, setManualResult] = useState<Result | undefined>(
    undefined,
  );
  const [manualOpen, setManualOpen] = useState<boolean>(false);
  const [skipResult, setSkipResult] = useState<Result | undefined>(undefined);
  const [skipOrderOpen, setSkipOrderOpen] = useState<boolean>(false);
  const router = useRouter();

  const { toast } = useToast();

  useEffect(() => {
    if (manualResult) {
      setLoadingManual(false);
    }
  }, [manualResult]);

  useEffect(() => {
    if (skipResult?.status === "success") {
      const urlWithParams = new URL(window.location.href);
      router.push(urlWithParams.toString()?.split("?")?.[0] ?? "/belt");
      setLoading?.(true);
    }
  }, [skipResult]);

  return (
    <Card className="w-full mb-6 overflow-hidden border-none shadow-sm">
      <CardContent
        className={cn("p-0", loading ? "animate-pulse animate-infinite" : "")}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0">
          <div className="p-4 md:col-span-3">
            <div className="flex items-center flex-wrap gap-8">
              <div className="font-semibold">
                <p className="text-xs text-muted-foreground ml-1">Belt Code</p>
                <div>
                  {userBeltCode?.length === 1 ? (
                    <BeltSelect
                      userBeltCode={userBeltCode}
                      currentBeltCode={currentBeltCode}
                    />
                  ) : (
                    <BeltBadge beltCode={currentBeltCode} />
                  )}
                </div>
              </div>

              {result?.status === "success" || result?.value?.orderId ? (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <SkipOrderModel
                    orderId={
                      result?.value?.orderDetails?.currentOrderIndex ??
                      result?.value?.orderId
                    }
                    open={skipOrderOpen}
                    setOpen={setSkipOrderOpen}
                    setResult={setSkipResult}
                  />

                  <div className="font-semibold">
                    <p className="text-xs text-muted-foreground">Batch ID</p>
                    <p className="font-semibold">
                      {result?.value?.orderDetails?.batchId || "N/A"}
                    </p>
                  </div>

                  {manualOpen ? (
                    <div className="relative ml-8">
                      <ManualForm
                        open={manualOpen}
                        setOpen={setManualOpen}
                        setResult={setManualResult}
                        pageLoading={loading}
                        setPageLoading={setLoading}
                      />
                      <Button
                        variant="ghost"
                        className="absolute -left-10 top-0 p-2 text-red-600 hover:text-red-700"
                        onClick={() => {
                          setManualOpen(false);
                          setLoadingManual(false);
                        }}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="font-semibold">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p
                              className="text-xs text-muted-foreground flex items-center gap-2 group cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  result?.value?.orderDetails
                                    ?.currentOrderIndex ??
                                    result?.value?.orderId ??
                                    "N/A",
                                );
                                toast({
                                  title: "Success",
                                  description: (
                                    <>
                                      order ID
                                      <span className="font-semibold text-green-600 ml-1">
                                        #
                                        {result?.value?.orderDetails
                                          ?.currentOrderIndex ??
                                          result?.value?.orderId ??
                                          "N/A"}
                                      </span>{" "}
                                      copied to clipboard
                                    </>
                                  ),
                                });
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

                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="font-semibold cursor-pointer flex items-center gap-2 group"
                              onClick={() => {
                                setManualOpen((prev) => !prev);
                                setLoadingManual(true);
                              }}
                            >
                              {result?.value?.orderDetails?.currentOrderIndex ??
                                result?.value?.orderId ??
                                "N/A"}
                              <MousePointerClickIcon className="h-5 w-5 group-hover:text-green-600 transition-all" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Click to open manual entry</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={loading}
                          onClick={() => setSkipOrderOpen(true)}
                          className="cursor-pointer group"
                        >
                          <SkipForwardIcon className="h-5 w-5 group-hover:text-yellow-600 transition-all" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Skip current order</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : undefined}
              {result?.status !== "success" &&
                result?.value?.orderId === undefined && (
                  <div className="mt-4 relative ml-8">
                    <ManualForm
                      open={manualOpen}
                      setOpen={setManualOpen}
                      setResult={setManualResult}
                      pageLoading={loading}
                      setPageLoading={setLoading}
                    />
                  </div>
                )}
            </div>
          </div>

          <div className="p-4 md:col-span-2 flex flex-wrap items-center justify-between gap-4 border-t md:border-l">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Orders in Queue</p>
                <p className="font-semibold">{result?.value?.length ?? 0}</p>
              </div>
            </div>
            {/* <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Package className="h-5 w-5 text-green-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatDate(new Date(), "UTC", "dd MMM yyyy")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground cursor-help">
                        Pushed to Stage 2
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatDate(new Date(), "UTC", "dd MMM yyyy")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="font-semibold text-green-600">
                  {PushToStage2Today}
                </p>
              </div>
            </div> */}
            {result?.value && (
              <>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <CheckLockFor
                          orderId={result?.value?.queue?.[0]?.orderId}
                          lockedForUserId={
                            result?.value?.queue?.[0]?.lockedForUserId
                          }
                          lockedAt={result?.value?.queue?.[0]?.lockedAt}
                          userBeltCode={userBeltCode}
                          loading={loading}
                          setLoading={setLoading}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="line-clamp-2 text-wrap text-center">
                        Current order is locked for the User. <br /> Click to
                        check again.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
