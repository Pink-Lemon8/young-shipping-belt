"use client";

import { ShowPicture } from "./data/show-picture";
import { pushQueueReview } from "./action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckIcon, Loader2, XIcon } from "lucide-react";
import { pharmacistReviewStatusTypes } from "@/db/schema";
import { useState, useEffect } from "react";
import DeniedModel from "./data/denied/model";
import ApprovedModel from "./data/approved/model";
import { Result } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function PharmacistReviewData({
  process = {},
  groupedProcess = [],
  loading = false,
  setLoading = undefined,
  setResult = undefined,
  notDrugPackages = [],
}: {
  process?: any;
  groupedProcess?: any[];
  loading?: boolean;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
  notDrugPackages?: string[] | undefined;
}) {
  const [openDenied, setOpenDenied] = useState<boolean>(false);
  const [openApproved, setOpenApproved] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === "Enter" && !loading) {
        event.preventDefault();
        setOpenApproved(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading]);

  const handlePushQueue = async (
    review: (typeof pharmacistReviewStatusTypes)[number],
    comment: string | undefined = undefined,
  ) => {
    setLoading?.(true);
    const res = await pushQueueReview(
      process?.orderId ?? "",
      groupedProcess?.map((o) => o.orderId).filter(Boolean),
      review,
      comment,
    );
    if (res?.status === "success") {
      if (review === "APPROVED")
        toast.success(res?.messages?.join(", ") ?? "Order pushed to queue");
      else toast.error(res?.messages?.join(", ") ?? "Order pushed to queue");
      setResult?.(res);
      const urlWithParams = new URL(window.location.href);
      if (urlWithParams.searchParams.get("orderId")) {
        urlWithParams.searchParams.delete("orderId");
        window.history.replaceState({}, "", urlWithParams.toString());
        window.location.reload();
      }
    } else {
      toast.error(res?.messages?.join(", ") ?? "Failed to push order to queue");
      setLoading?.(false);
    }
    return res;
  };

  const handlePush = async (
    review: (typeof pharmacistReviewStatusTypes)[number],
    comment: string | undefined = undefined,
  ) => {
    let res: Result = {
      status: "error",
      messages: ["Invalid review type"],
    } as Result;
    if (review === "APPROVED") {
      res = await handlePushQueue("APPROVED", undefined);
    }
    if (review === "DENIED") {
      if (!comment || comment.trim() === "") {
        toast.error("Please provide a reason for denying the order");
        return {
          status: "error",
          messages: ["Please provide a reason for denying the order"],
        } as Result;
      }
      res = await handlePushQueue("DENIED", comment);
    }
    return res;
  };

  return (
    <>
      <div className="container mx-auto max-w-4xl pb-24 md:pb-4">
        {loading ? (
          <div className="flex justify-center items-center mt-5">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Image display - takes full width on mobile */}
            <div className="w-full">
              {process?.images?.length > 0 && (
                <ShowPicture images={process.images} />
              )}
            </div>

            {/* Patient and Medication info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-semibold text-lg">
                  {process?.patientName || "N/A"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Medication</p>
                <div className="font-semibold text-lg">
                  {process?.items?.length > 0
                    ? process?.items
                      ?.filter(
                        (item: any) =>
                          !notDrugPackages?.includes(item.packageId),
                      )
                      .map((item: any, index: number) => (
                        <div key={index}>
                          <div className="flex items-center gap-2">
                            <p>
                              <span className="font-semibold text-red-600 whitespace-nowrap">
                                {item.din ?? item.Package?.Drug?.din ??
                                  item.packageId}
                              </span>{" "}
                              {item.description}
                            </p>
                            x{" "}
                            <span className="font-bold text-2xl border border-secondary rounded-md px-4 py-1 text-red-600">
                              {item.quantity}
                            </span>
                          </div>
                          {process?.items?.filter(
                            (item: any) =>
                              !notDrugPackages?.includes(item.packageId),
                          ).length !==
                            index + 1 && <Separator className="my-1" />}
                        </div>
                      )) || "N/A"
                    : "N/A"}
                </div>
              </div>
              {groupedProcess?.length > 0 && (
                <div className="text-center">
                  <div className="font-semibold text-lg">
                    {groupedProcess
                      ?.filter((o) => o.patientName !== process?.patientName)
                      .map((o) => o.patientName)
                      .join(", ")}
                  </div>
                </div>
              )}
              {groupedProcess?.length > 0 && (
                <div className="text-center">
                  <div className="font-semibold text-lg">
                    {groupedProcess
                      ?.flatMap((o) => o.items)
                      ?.filter(
                        (item: any) =>
                          !notDrugPackages?.includes(item.packageId),
                      )
                      .map((item: any, index: number) => (
                        <div key={index}>
                          <div className="flex items-center gap-2">
                            <p>
                              <span className="font-semibold text-red-600 whitespace-nowrap">
                                {item.din ?? item.Package?.Drug?.din ??
                                  item.packageId}
                              </span>{" "}
                              {item.description}
                            </p>
                            x{" "}
                            <span className="font-bold text-2xl border border-secondary rounded-md px-4 py-1 text-red-600">
                              {item.quantity}
                            </span>
                          </div>
                          {groupedProcess
                            ?.flatMap((o) => o.items)
                            ?.filter(
                              (item: any) =>
                                !notDrugPackages?.includes(item.packageId),
                            ).length !==
                            index + 1 && <Separator className="my-1" />}
                        </div>
                      )) || "N/A"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 mb-0 md:mb-12 z-50 md:relative md:bottom-auto md:left-auto md:right-auto md:border-t-0 md:p-0 md:mt-4">
          <div className="flex gap-4 max-w-4xl mx-auto px-4">
            <Button
              variant="destructive"
              onClick={() => setOpenDenied(true)}
              disabled={loading}
              className="flex-1 h-12 text-base bg-destructive text-background cursor-pointer"
              style={{
                position: "relative",
                zIndex: 50,
              }}
            >
              <XIcon className="mr-2 h-5 w-5" /> Deny
            </Button>
            <Button
              onClick={() => setOpenApproved(true)}
              disabled={loading}
              className="flex-1 h-12 text-base text-background bg-green-600 hover:bg-green-700 cursor-pointer"
              style={{
                position: "relative",
                zIndex: 50,
              }}
            >
              <CheckIcon className="mr-2 h-5 w-5" /> Approve
            </Button>
          </div>
        </div>
      )}

      <ApprovedModel
        open={openApproved}
        setOpen={setOpenApproved}
        onPushQueue={handlePush}
      />
      <DeniedModel
        open={openDenied}
        setOpen={setOpenDenied}
        onPushQueue={handlePush}
      />
    </>
  );
}
