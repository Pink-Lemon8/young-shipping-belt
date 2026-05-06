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
import { BeltSelect } from "./belt-select";
import { BeltBadge } from "./belt-badge";
import { Result } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import ManualForm from "./data/manual/form";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/hooks/use-toast";
import { beltStages } from "@/lib/const";

type BeltHeaderProps = {
  loading: boolean;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  currentBeltCode: string;
  userBeltCode: string;
  result: Result | undefined;
  pushedOrdersCountToday?: number;
};

export default function BeltHeader({
  loading,
  setLoading,
  currentBeltCode,
  userBeltCode,
  result,
  pushedOrdersCountToday = 0,
}: BeltHeaderProps) {
  const [loadingManual, setLoadingManual] = useState<boolean>(false);
  const [manualResult, setManualResult] = useState<Result | undefined>(
    undefined,
  );
  const [manualOpen, setManualOpen] = useState<boolean>(false);
  const { toast } = useToast();
  useEffect(() => {
    if (manualResult) {
      setLoadingManual(false);
    }
  }, [manualResult]);

  return (
    <Card className="w-full mb-6 overflow-hidden border-none shadow-sm">
      <CardContent
        className={cn("p-0", loading ? "animate-pulse animate-infinite" : "")}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0">
          <div className="p-4 md:col-span-2">
            <div className="flex items-center flex-wrap gap-8">
              <div>
                <p className="text-xs text-muted-foreground">Belt Code</p>
                <div className="font-semibold">
                  {userBeltCode.length === 1 ? (
                    <BeltSelect
                      userBeltCode={userBeltCode}
                      currentBeltCode={currentBeltCode}
                    />
                  ) : (
                    <BeltBadge beltCode={currentBeltCode} />
                  )}
                </div>
              </div>

              {result?.status === "success" ? (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Batch ID</p>
                    <p className="font-semibold">
                      {result?.value?.orderDetails?.batchId || "N/A"}
                    </p>
                  </div>

                  {manualOpen ? (
                    <div className="relative ml-6">
                      <ManualForm
                        open={manualOpen}
                        setOpen={setManualOpen}
                        setResult={setManualResult}
                        pageLoading={loading}
                        setPageLoading={setLoading}
                      />
                      <Button
                        variant="ghost"
                        className="absolute -left-8 top-0 p-2 text-red-600 hover:text-red-700"
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
                                    ?.currentOrderIndex ?? "",
                                );
                                toast({
                                  title: "Success",
                                  description: (
                                    <>
                                      order ID
                                      <span className="font-semibold text-green-600 ml-1">
                                        #
                                        {result?.value?.orderDetails
                                          ?.currentOrderIndex ?? ""}
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
                              {result?.value?.orderDetails?.currentOrderIndex}
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
                </div>
              ) : (
                <>
                  <div className="relative ml-2 mt-4">
                    <ManualForm
                      open={manualOpen}
                      setOpen={setManualOpen}
                      setResult={setManualResult}
                      pageLoading={loading}
                      setPageLoading={setLoading}
                    />
                    <Button
                      variant="ghost"
                      className="absolute -left-8 top-0 p-2 text-red-600 hover:text-red-700"
                      onClick={() => {
                        setManualOpen(false);
                        setLoadingManual(false);
                      }}
                    ></Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-4 border-t md:border-l">
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
                        {currentBeltCode.includes("2")
                          ? "Pushed to Stage 3"
                          : "Completed"}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatDate(new Date(), "UTC", "dd MMM yyyy")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <p className="font-semibold text-green-600">
                  {pushedOrdersCountToday}
                </p>
              </div>
            </div> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
