"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, ClipboardList, XIcon } from "lucide-react";
import { useState } from "react";
import DeniedModel from "./denied/model";
import { pharmacistReviewStatusTypes } from "@/db/schema";
import ApprovedModel from "./approved/model";
import { measurementString } from "@/lib/utils";
import { InfoItems } from "./info/items";
import { InfoAffiliate } from "./info/affiliate";
import { InfoOrder } from "./info/order";
import { Result } from "@/lib/types";

export function OrderInfo({
  data,
  process,
  handlePushQueue,
}: {
  data: any;
  process: any;
  handlePushQueue: (
    review: (typeof pharmacistReviewStatusTypes)[number],
    comment?: string | undefined
  ) => Promise<Result>;
}) {
  const [openDenied, setOpenDenied] = useState<boolean>(false);
  const [openApproved, setOpenApproved] = useState<boolean>(false);

  const handlePush = async (
    review: (typeof pharmacistReviewStatusTypes)[number],
    comment: string | undefined = undefined
  ) => {
    if (review === "APPROVED") {
      return await handlePushQueue("APPROVED", undefined);
    }
    if (review === "DENIED") {
      return await handlePushQueue("DENIED", comment);
    }
    return {
      status: "error",
      messages: ["Invalid review"],
    } as Result;
  };

  return (
    <>
      <ApprovedModel
        open={openApproved}
        setOpen={setOpenApproved}
        onPushQueue={handlePush}
      ></ApprovedModel>
      <DeniedModel
        open={openDenied}
        setOpen={setOpenDenied}
        onPushQueue={handlePush}
      ></DeniedModel>
      <Card className="w-full">
        <CardHeader className="bg-primary/5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Order Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 pb-0">
            <InfoAffiliate affiliate={process.Affiliate} />
          </div>

          <div className="p-4">
            <InfoOrder data={data} />
          </div>

          <div className="p-4">
            <InfoItems items={data.items} />
          </div>

          <div className="p-4 bg-muted/20 border-t">
            <div className="flex justify-end space-x-4">
              <>
                <Button
                  variant="destructive"
                  className="gap-2 text-white"
                  onClick={() => setOpenDenied(true)}
                >
                  <XIcon className="h-5 w-5" /> Deny
                </Button>
                <Button
                  onClick={() => setOpenApproved(true)}
                  className="gap-2 text-white bg-green-600 hover:bg-green-500"
                >
                  <CheckIcon className="h-5 w-5" /> Approve
                </Button>
              </>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
