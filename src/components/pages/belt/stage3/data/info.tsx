"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRightIcon,
  ClipboardList,
  RefreshCwIcon,
  Copy,
  Check,
} from "lucide-react";
import { CameraIcon } from "lucide-react";
import { useState } from "react";
import { InfoBoxSize } from "../../data/info/box";
import { InfoOrder } from "../../data/info/order";
import { InfoAffiliate, InfoLymlight } from "../../data/info/affiliate";
import { InfoItems } from "./info/items";
import { InfoGroupOrder } from "../../data/info/groupOrder";

export function OrderInfo({
  data,
  process,
  groupedProcess,
  takePicture,
  setTakePicture,
  handlePushQueue,
}: {
  data: any;
  process: any;
  groupedProcess: any[];
  takePicture: boolean;
  setTakePicture: React.Dispatch<React.SetStateAction<boolean>>;
  handlePushQueue: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyTrackingNumber = () => {
    if (process.trackingNumber) {
      navigator.clipboard.writeText(process.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full overflow-hidden border-none shadow-sm">
        <CardHeader className="bg-primary/5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Order Details</CardTitle>
            </div>
            {process.trackingNumber && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tracking:</span>
                <span className="font-mono font-medium">
                  {process.trackingNumber}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={copyTrackingNumber}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="p-4 pb-0">
            {process.Affiliate ? (
              <InfoAffiliate affiliate={process.Affiliate} />
            ) : (
              <InfoLymlight organization={data?.organization} />
            )}
          </div>

          <div className="p-4">
            <InfoOrder
              data={{ ...data, affiliateId: process.Affiliate?.id ?? -1 }}
            />
          </div>

          {groupedProcess?.length > 0 && (
            <div className="p-4">
              <InfoGroupOrder groupedProcess={groupedProcess} />
            </div>
          )}

          <div className="p-4">
            <InfoBoxSize
              BoxSize={process.BoxSize}
              tempaidBoxId={process?.TempaidBox?.boxNumber ?? undefined}
            />
          </div>

          <div className="p-4 bg-muted/20 border-t">
            <div className="flex justify-end space-x-4">
              {!takePicture ? (
                <Button
                  onClick={() => setTakePicture(true)}
                  className="gap-2 cursor-pointer"
                >
                  <CameraIcon className="mr-2 min-h-5 min-w-5" />
                  Take Picture
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setTakePicture(false)}
                    variant="outline"
                    className="gap-2 cursor-pointer"
                  >
                    <RefreshCwIcon className="mr-2 min-h-5 min-w-5" />
                    Retake Picture
                  </Button>
                  <Button
                    onClick={handlePushQueue}
                    className="gap-2 bg-green-600 hover:bg-green-700 cursor-pointer text-white hover:text-white"
                  >
                    Send to Cage
                    <ChevronRightIcon className="ml-2 min-h-5 min-w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
