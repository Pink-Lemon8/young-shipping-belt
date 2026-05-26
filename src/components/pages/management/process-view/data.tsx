"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Info,
  ChevronDown,
  MessageSquare,
  BellRing,
  Radar,
  TriangleAlertIcon,
  SkipBack,
  Trash,
  Loader2,
  Lock,
  CheckCheck,
  MoreVertical,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageNumber from "@/components/common/pagination-page";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Process View Components
import { Status } from "./status";
import { PharmacistReviewStatus } from "./pharmacist-review-status";
import { ProcessViewInfoModel } from "./info/model";
import ProcessViewFilter from "./filter";
import { PharmacistDeniedSmsNotificationModel } from "./pharmacist-denied-sms-notification/model";
import UnSkipOrderModel from "../../belt/data/skip-order/unSkip-model";
import { TooltipContent } from "@/components/ui/tooltip";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import Search from "./search";
import { PushBackToStage1Dialog } from "./push-back-to-stage1/dialog";
import { DeleteFromBeltDialog } from "./delete-from-belt/dialog";
import UnlockOrderModel from "./unlock-order/model";
import { Separator } from "@/components/ui/separator";
import { ManualPushCompletedDialog } from "./manual-push-completed/dialog";
import { UpdateLymlightStatusDialog } from "./update-lymlight-status/dialog";
import { ViewItemsDialog } from "./view-items/dialog";
import { UploadStageImageDialog } from "./upload-stage-image/dialog";
import { ImagePlus, Pill } from "lucide-react";
import {
  OrderedMetadataBadge,
  ReceivedMetadataBadge,
  SpecialMetadataBadge,
} from "./metadata-item-badges";

type ProcessViewDataProps = {
  queues?: any[];
  length?: number;
  totalPages?: number;
  maxOnPage?: number;
  groupIdToOrderIds?: Record<number, string[]>;
};

/** One row in the list: either a single order or a merged group (main + members) */
type MergedRow = { main: any; groupMembers: any[] };

function mergeQueuesByGroup(queues: any[]): MergedRow[] {
  const hasGroup = (q: any) =>
    q.groupId != null &&
    q.groupId !== "" &&
    q.groupId !== -1 &&
    q.groupId !== "-1";
  const rows: MergedRow[] = [];
  const seenGroupIds = new Set<string | number>();
  for (const q of queues) {
    if (!hasGroup(q)) {
      rows.push({ main: q, groupMembers: [] });
      continue;
    }
    const gid = q.groupId;
    if (seenGroupIds.has(gid)) continue;
    seenGroupIds.add(gid);
    const groupMembers = queues.filter(
      (o) => hasGroup(o) && (o.groupId === gid || o.groupId === Number(gid)),
    );
    const [main, ...rest] = groupMembers;
    rows.push({ main: main ?? q, groupMembers: rest });
  }
  return rows;
}

export default function ProcessViewData({
  queues = [],
  length = 0,
  totalPages = 1,
  maxOnPage = 15,
  groupIdToOrderIds = {},
}: ProcessViewDataProps) {
  const mergedRows = useMemo(() => mergeQueuesByGroup(queues), [queues]);

  const [loading, setLoading] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [open, setOpen] = useState<boolean>(false);
  const [pushBackToStage1Open, setPushBackToStage1Open] =
    useState<boolean>(false);
  const [queue, setQueue] = useState<any>(undefined);
  const [groupedQueues, setGroupedQueues] = useState<any[]>([]);
  const [search, setSearch] = useState<string>(
    searchParams.get("search") ?? "",
  );
  const [
    pharmacistDeniedSmsNotificationOpen,
    setPharmacistDeniedSmsNotificationOpen,
  ] = useState<boolean>(false);

  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(searchParams.get("page") ?? "1"),
  );

  const toggleExpand = (id: string) => {
    setIsExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [unSkipOrderOpen, setUnSkipOrderOpen] = useState<boolean>(false);
  const [deleteFromBeltOpen, setDeleteFromBeltOpen] = useState<boolean>(false);
  const [completeOrderOpen, setCompleteOrderOpen] = useState<boolean>(false);
  const [updateLymlightStatusOpen, setUpdateLymlightStatusOpen] =
    useState<boolean>(false);

  const [unlockOrderOpen, setUnlockOrderOpen] = useState<boolean>(false);
  const [viewItemsOpen, setViewItemsOpen] = useState<boolean>(false);
  const [uploadStageImageOpen, setUploadStageImageOpen] =
    useState<boolean>(false);
  const [uploadStageImageDefaultStage, setUploadStageImageDefaultStage] =
    useState<"1" | "2" | "3">("1");

  useEffect(() => {
    setLoading(true);
  }, [search, currentPage, maxOnPage]);

  useEffect(() => {
    setLoading(false);
  }, [queues]);

  const openQueueDetails = (selectedQueue: any) => {
    setQueue(selectedQueue);
    setGroupedQueues(
      mergedRows
        .filter((row: any) => row.main.orderId === selectedQueue.orderId)
        .map((row: any) => row.groupMembers)
        .flat() ?? [],
    );
    setOpen(true);
  };

  const renderActionMenu = (selectedQueue: any) => {
    const viewItemsButton = (
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer gap-1"
        onClick={() => {
          setQueue(selectedQueue);
          setViewItemsOpen(true);
        }}
      >
        <Pill className="h-4 w-4" />
        View Items
      </Button>
    );

    if (selectedQueue.status === "PENDING") {
      return viewItemsButton;
    }
    return (
      <div className="flex items-center gap-1">
        {viewItemsButton}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="cursor-pointer gap-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {!["SENT_TO_BELT", "STAGE1"].includes(selectedQueue.status) && (
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={() => {
                  setQueue(selectedQueue);
                  setPushBackToStage1Open(true);
                }}
              >
                <SkipBack className="h-4 w-4" />
                Push Back to Stage 1
              </DropdownMenuItem>
            )}
            {["STAGE2", "STAGE3"].includes(selectedQueue.status) && (
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={() => {
                  setQueue(selectedQueue);
                  setCompleteOrderOpen(true);
                }}
              >
                <CheckCheck className="h-4 w-4 text-green-600" />
                Push Completed
              </DropdownMenuItem>
            )}
            {selectedQueue.affiliateId === -1 &&
              selectedQueue.status === "COMPLETED" && (
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onSelect={() => {
                    setQueue(selectedQueue);
                    setUpdateLymlightStatusOpen(true);
                  }}
                >
                  <Radar className="h-4 w-4 text-violet-600" />
                  Update Lymlight Status
                </DropdownMenuItem>
              )}
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onSelect={() => {
                setQueue(selectedQueue);
                const s = selectedQueue.status;
                const defaultStage: "1" | "2" | "3" =
                  s === "STAGE3" || s === "COMPLETED"
                    ? "3"
                    : s === "STAGE2"
                      ? "2"
                      : "1";
                setUploadStageImageDefaultStage(defaultStage);
                setUploadStageImageOpen(true);
              }}
            >
              <ImagePlus className="h-4 w-4 text-blue-600" />
              Upload Stage Image
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              onSelect={() => {
                setQueue(selectedQueue);
                setDeleteFromBeltOpen(true);
              }}
            >
              <Trash className="h-4 w-4" />
              Delete from Belt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onSelect={() => openQueueDetails(selectedQueue)}
            >
              <Info className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
      <div className="mb-3">
        <ProcessViewFilter
          loading={loading}
          setLoading={setLoading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      <ProcessViewInfoModel
        open={open}
        setOpen={setOpen}
        queue={queue}
        groupedQueues={groupedQueues}
      />
      <PharmacistDeniedSmsNotificationModel
        open={pharmacistDeniedSmsNotificationOpen}
        setOpen={setPharmacistDeniedSmsNotificationOpen}
      />

      <UnSkipOrderModel
        orderId={queue?.orderId}
        reason={queue?.comments}
        open={unSkipOrderOpen}
        setOpen={setUnSkipOrderOpen}
      />

      <UnlockOrderModel
        orderId={queue?.orderId}
        open={unlockOrderOpen}
        setOpen={setUnlockOrderOpen}
      />

      <PushBackToStage1Dialog
        open={pushBackToStage1Open}
        setOpen={setPushBackToStage1Open}
        orderId={queue?.orderId}
        queue={queue}
      />

      <DeleteFromBeltDialog
        open={deleteFromBeltOpen}
        setOpen={setDeleteFromBeltOpen}
        orderId={queue?.orderId}
        queue={queue}
      />

      <ManualPushCompletedDialog
        open={completeOrderOpen}
        setOpen={setCompleteOrderOpen}
        orderId={queue?.orderId}
        queue={queue}
      />

      <UpdateLymlightStatusDialog
        open={updateLymlightStatusOpen}
        setOpen={setUpdateLymlightStatusOpen}
        orderId={queue?.orderId}
        queue={queue}
      />

      <UploadStageImageDialog
        open={uploadStageImageOpen}
        setOpen={setUploadStageImageOpen}
        orderId={queue?.orderId}
        defaultStage={uploadStageImageDefaultStage}
      />

      <ViewItemsDialog
        open={viewItemsOpen}
        setOpen={setViewItemsOpen}
        orderId={queue?.orderId}
      />

      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="sr-only">Process Queue</CardTitle>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                searchText={search}
                setSearchText={setSearch}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                placeholder="Search by Order ID, Patient ID/Name, or Tracking Number"
              />
            </div>
            <div className="flex gap-2 items-center justify-center sm:justify-start">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Showing <span className="font-medium">{length}</span> results
              </span>
              <Button
                variant="outline"
                onClick={() => setPharmacistDeniedSmsNotificationOpen(true)}
                className="ml-2"
              >
                <BellRing className="h-4 w-4" />
                SMS Notification
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border/60 bg-card">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center border-t border-border/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <span className="text-sm font-medium text-muted-foreground mb-1">
                  Loading ...
                </span>
                <Button
                  variant="link"
                  className="p-0 text-primary underline cursor-pointer"
                  onClick={() => window.location.reload()}
                >
                  Click to refresh
                </Button>
              </div>
            ) : queues.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center animate-fadeIn">
                <span className="text-xl font-bold text-primary mb-2">
                  No Orders to Show
                </span>
                <span className="text-base text-muted-foreground mb-3">
                  Looks like there aren&apos;t any orders for this page.<br />
                  Try changing your filters or check again later.
                </span>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border/60">
                      <TableHead className="font-semibold text-muted-foreground whitespace-nowrap px-4 py-3">
                        Order ID
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground whitespace-nowrap px-4 py-3">
                        Patient ID
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground whitespace-nowrap px-4 py-3">
                        Patient Name
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground whitespace-nowrap px-4 py-3">
                        Tracking Number
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground whitespace-nowrap px-4 py-3">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground whitespace-nowrap px-4 py-3">
                        Pharmacist Review
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground whitespace-nowrap px-4 py-3">
                        Label Created at
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground whitespace-nowrap px-4 py-3">
                        Sent to Belt at
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground whitespace-nowrap px-4 py-3">
                        Shipped at
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right whitespace-nowrap px-4 py-3">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!loading &&
                      mergedRows?.length > 0 &&
                      mergedRows?.map((row) => {
                        const queue = row.main;
                        const isGroup = row.groupMembers.length > 0;
                        const orderIdsInGroup = isGroup
                          ? [
                            queue.orderId,
                            ...row.groupMembers.map((m: any) => m.orderId),
                          ]
                          : [];
                        const orderIdsForTooltip =
                          isGroup &&
                            queue.groupId != null &&
                            groupIdToOrderIds[queue.groupId]?.length
                            ? groupIdToOrderIds[queue.groupId]
                            : orderIdsInGroup;
                        const rowQueues = [queue, ...row.groupMembers];
                        const allItemsOrdered = rowQueues.every(
                          (q: any) => q.allItemsOrdered,
                        );
                        const allItemsSpecial = rowQueues.every(
                          (q: any) => q.allItemsSpecial,
                        );
                        const allItemsReceived = rowQueues.every(
                          (q: any) => q.allItemsReceived,
                        );
                        return (
                          <TableRow
                            key={queue.id}
                            className={cn(
                              "border-border/40 transition-colors",
                              isGroup && "bg-amber-500/5 dark:bg-amber-700/10",
                            )}
                          >
                            <TableCell className="font-medium align-middle px-4 py-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {queue.lockedForUserId && (
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 shrink-0 cursor-pointer"
                                          onClick={() => {
                                            setQueue(queue);
                                            setUnlockOrderOpen(true);
                                          }}
                                        >
                                          <Lock className="text-destructive stroke-[2.5] h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-center bg-background text-foreground shadow-md rounded-lg px-4 py-3 min-w-[200px]">
                                        <div className="flex flex-col items-center gap-1">
                                          <span className="font-semibold text-base text-primary">
                                            {queue.LockedForBeltUser.name}
                                          </span>
                                          <span className="text-xs text-muted-foreground break-all">
                                            {queue.LockedForBeltUser.email}
                                          </span>
                                          <span className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                            <Lock className="h-3 w-3" /> Locked By
                                            Belt User
                                          </span>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {queue.skipped && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 shrink-0 cursor-pointer"
                                          onClick={() => {
                                            setQueue(queue);
                                            setUnSkipOrderOpen(true);
                                          }}
                                        >
                                          <TriangleAlertIcon className="text-yellow-600 stroke-[2.5] h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-center">
                                        <p>Skipped Order</p>
                                        {queue.comments?.length > 0 && (
                                          <p>
                                            Reason: {queue.comments?.join(", ")}
                                          </p>
                                        )}
                                        <p>Click to open the order</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {isGroup ? (
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="cursor-help truncate">
                                          G-{queue.groupId}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="right"
                                        className="max-w-xs bg-background text-foreground shadow-md rounded-lg px-4 py-3 min-w-[200px] border-2 border-primary"
                                      >
                                        <p className="font-medium text-foreground mb-1">
                                          Order IDs
                                        </p>
                                        <p className="text-sm break-all">
                                          {orderIdsForTooltip.join(", ")}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span className="truncate block">
                                    {queue.orderId}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-middle px-4 py-3 text-muted-foreground font-medium">
                              {isGroup ? (
                                <div className="flex flex-col gap-0.5">
                                  {[
                                    queue.patientId,
                                    ...row.groupMembers.map(
                                      (m: any) => m.patientId,
                                    ),
                                  ]
                                    .filter(
                                      (pid: string, index: number, arr: string[]) =>
                                        arr.indexOf(pid) === index,
                                    )
                                    .map((pid: string, i: number) => (
                                      <span
                                        key={i}
                                        className="truncate block text-sm"
                                      >
                                        {pid}
                                      </span>
                                    ))}
                                </div>
                              ) : (
                                <span className="truncate block text-sm">
                                  {queue.patientId}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="align-middle px-4 py-3 text-muted-foreground font-medium">
                              {isGroup ? (
                                <div className="flex flex-col gap-0.5">
                                  {[
                                    queue.patientName,
                                    ...row.groupMembers.map(
                                      (m: any) => m.patientName,
                                    ),
                                  ]
                                    .filter(
                                      (pid: string, index: number, arr: string[]) =>
                                        arr.indexOf(pid) === index,
                                    )
                                    .map((pid: string, i: number) => (
                                      <span
                                        key={i}
                                        className="truncate block text-sm"
                                      >
                                        {pid}
                                      </span>
                                    ))}
                                </div>
                              ) : (
                                <span className="truncate block text-sm">
                                  {queue.patientName}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="align-middle px-4 py-3 text-sm text-primary font-semibold max-w-[125px]">
                              {queue.trackingNumber}
                            </TableCell>
                            <TableCell className="align-middle px-4 py-3 min-w-[165px]">
                              <div className="flex flex-col items-start gap-2">
                                <Status status={queue.status} />
                                {(allItemsOrdered ||
                                  allItemsSpecial ||
                                  allItemsReceived) && (
                                  <div className="flex flex-row flex-nowrap items-center gap-1.5">
                                    {allItemsOrdered && !allItemsSpecial && (
                                      <OrderedMetadataBadge tooltip="All expected items have prep marked as ordered." />
                                    )}
                                    {allItemsSpecial && (
                                      <SpecialMetadataBadge tooltip="All expected items have prep marked as special." />
                                    )}
                                    {allItemsReceived && (
                                      <ReceivedMetadataBadge tooltip="All expected items are marked as received." />
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-middle px-4 py-3 min-w-[240px] max-w-[240px]">
                              {queue.PharmacistReview !== null &&
                                queue.PharmacistReview?.length > 0 ? (
                                <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
                                  {queue.PharmacistReview.map(
                                    (review: any, index: number) => (
                                      <TooltipProvider
                                        key={index}
                                        delayDuration={0}
                                      >
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="cursor-pointer w-fit">
                                              <PharmacistReviewStatus
                                                status={review.status}
                                              />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent className="text-center max-w-xs">
                                            <p>
                                              {review.status} by{" "}
                                              <span className="font-bold">
                                                {review.ReviewBy?.name ?? "—"}
                                              </span>
                                              {review.status === "DENIED" && (
                                                <>
                                                  <br />
                                                  Reason:{" "}
                                                  {review.reason?.length > 0
                                                    ? review.reason
                                                    : "N/A"}
                                                </>
                                              )}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <PharmacistReviewStatus status="PENDING" />
                              )}
                            </TableCell>
                            <TableCell className="align-middle px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {queue.labelCreatedAt ? (
                                formatDate(queue.labelCreatedAt)
                              ) : (
                                <span className="opacity-60">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="align-middle px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {queue.createdAt ? (
                                formatDate(queue.createdAt)
                              ) : (
                                <span className="opacity-60">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="align-middle px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {queue.shippedAt ? (
                                formatDate(queue.shippedAt)
                              ) : (
                                <span className="opacity-60">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="align-middle px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                {renderActionMenu(queue)}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </>
            )}
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center border-t border-border/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <span className="text-sm font-medium text-muted-foreground mb-1">
                  Loading ...
                </span>
                <Button
                  variant="link"
                  className="p-0 text-primary underline cursor-pointer"
                  onClick={() => window.location.reload()}
                >
                  Click to refresh
                </Button>
              </div>
            ) : mergedRows.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center animate-fadeIn">
                <span className="text-xl font-bold text-primary mb-2">
                  No Orders to Show
                </span>
                <span className="text-base text-muted-foreground mb-3">
                  Looks like there aren&apos;t any orders for this page.<br />
                  Try changing your filters or check again later.
                </span>
              </div>
            ) : (
              mergedRows.map((row) => {
                const queue = row.main;
                const isGroup = row.groupMembers.length > 0;
                const orderIdsInGroup = isGroup
                  ? [
                    queue.orderId,
                    ...row.groupMembers.map((m: any) => m.orderId),
                  ]
                  : [];
                const orderIdsForTooltip =
                  isGroup &&
                    queue.groupId != null &&
                    groupIdToOrderIds[queue.groupId]?.length
                    ? groupIdToOrderIds[queue.groupId]
                    : orderIdsInGroup;
                const rowQueues = [queue, ...row.groupMembers];
                const allItemsOrdered = rowQueues.every(
                  (q: any) => q.allItemsOrdered,
                );
                const allItemsSpecial = rowQueues.every(
                  (q: any) => q.allItemsSpecial,
                );
                const allItemsReceived = rowQueues.every(
                  (q: any) => q.allItemsReceived,
                );
                return (
                  <Card
                    key={queue.id}
                    className={cn(
                      "queue-list-item border border-border/50 shadow-sm",
                      isGroup && "border-amber-500/30 bg-amber-500/5",
                    )}
                  >
                    <div
                      className="p-3 cursor-pointer flex gap-2 flex-wrap items-center"
                      onClick={() => toggleExpand(queue.id)}
                    >
                      {queue.lockedForUserId && (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild className="m-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer"
                                onClick={() => {
                                  setQueue(queue);
                                  setUnlockOrderOpen(true);
                                }}
                              >
                                <Lock className="text-destructive stroke-[2.5] h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-center bg-background text-foreground shadow-md rounded-lg px-4 py-3 min-w-[200px]">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold text-base text-primary">
                                  {queue.LockedForBeltUser.name}
                                </span>
                                <span className="text-xs text-muted-foreground break-all">
                                  {queue.LockedForBeltUser.email}
                                </span>
                                <span className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                  <Lock className="h-3 w-3" /> Locked By Belt
                                  User
                                </span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {queue.skipped && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild className="m-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer"
                                onClick={() => {
                                  setQueue(queue);
                                  setUnSkipOrderOpen(true);
                                }}
                              >
                                <TriangleAlertIcon className="text-yellow-600 stroke-[2.5] h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-center">
                              <p>Skipped Order</p>
                              {queue.comments?.length > 0 && (
                                <p>Reason: {queue.comments?.join(", ")}</p>
                              )}
                              <p>Click to open the order</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <div className="flex justify-between grow items-start">
                        <div className="flex flex-col gap-1 min-w-[180px]">
                          {/* Order ID*/}
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs text-muted-foreground/90">
                              Order:
                            </span>
                            {isGroup ? (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help font-medium text-sm text-primary">
                                      G-{queue.groupId}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-xs"
                                  >
                                    <p className="font-medium mb-1">
                                      Order IDs
                                    </p>
                                    <p className="text-sm break-all">
                                      {orderIdsForTooltip.join(", ")}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="font-medium text-sm">
                                {queue.orderId}
                              </span>
                            )}
                          </div>

                          <div className="flex items-start gap-1">
                            <span className="font-semibold text-xs text-muted-foreground/90">
                              Patient ID{isGroup ? "s" : ""}:
                            </span>
                            {isGroup ? (
                              <div className="flex flex-col gap-[2px] mt-0.5">
                                {[
                                  queue.patientId,
                                  ...row.groupMembers.map(
                                    (m: any) => m.patientId,
                                  ),
                                ].map((pid: string, i: number) => (
                                  <span key={i} className="truncate block text-xs font-medium text-foreground">
                                    {pid}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="truncate block text-xs font-medium text-foreground">
                                {queue.patientId}
                              </span>
                            )}
                          </div>

                          {/* Patient Names */}
                          <div className="flex items-start gap-1">
                            <span className="font-semibold text-xs text-muted-foreground/90">
                              Patient Name:
                            </span>
                            {isGroup ? (
                              <div className="flex flex-col gap-[2px] mt-0.5">
                                {[
                                  queue.patientName,
                                  ...row.groupMembers.map(
                                    (m: any) => m.patientName,
                                  ),
                                ].map((pid: string, i: number) => (
                                  <span key={i} className="truncate block text-xs font-medium text-foreground">
                                    {pid ?? "N/A"}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="truncate block text-xs font-medium text-foreground">
                                {queue.patientName ?? "N/A"}
                              </span>
                            )}
                          </div>

                          {/* Tracking Number */}
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs text-muted-foreground/90">
                              Tracking:
                            </span>
                            <span className="truncate block text-xs font-medium text-primary">
                              {queue.trackingNumber || <span className="italic text-muted-foreground">N/A</span>}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1.5">
                          <Status status={queue.status} />
                          {allItemsOrdered && !allItemsSpecial && (
                            <OrderedMetadataBadge tooltip="All expected items have prep marked as ordered" />
                          )}
                          {allItemsSpecial && (
                            <SpecialMetadataBadge tooltip="All expected items have prep marked as special" />
                          )}
                          {allItemsReceived && (
                            <ReceivedMetadataBadge tooltip="All expected items are marked as received" />
                          )}
                          <ChevronDown
                            size={16}
                            className={`shrink-0 transition-transform ${isExpanded[queue.id] ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>
                    </div>

                    {isExpanded[queue.id] && (
                      <>
                        <div className="px-4 pb-4 border-t border-border/50 pt-3">
                          <div className="flex flex-col gap-2 mt-3">
                            {/* Timeline Style Dates */}
                            <div className="flex items-center gap-3 md:gap-6">
                              <div className="flex flex-col items-center flex-1">
                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                                  Label Created
                                </div>
                                <div className="bg-muted/80 rounded px-2 py-1 text-xs font-medium text-primary shadow-inner min-w-24 text-center">
                                  {queue.labelCreatedAt ? formatDate(queue.labelCreatedAt) : <span className="opacity-60">N/A</span>}
                                </div>
                              </div>
                              <div className="flex flex-col items-center flex-1">
                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                                  Sent to Belt
                                </div>
                                <div className="bg-muted/80 rounded px-2 py-1 text-xs font-medium text-primary shadow-inner min-w-24 text-center">
                                  {queue.createdAt ? formatDate(queue.createdAt) : <span className="opacity-60">N/A</span>}
                                </div>
                              </div>
                              <div className="flex flex-col items-center flex-1">
                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                                  Shipped At
                                </div>
                                <div className="bg-muted/80 rounded px-2 py-1 text-xs font-medium text-primary shadow-inner min-w-24 text-center">
                                  {queue.shippedAt ? formatDate(queue.shippedAt) : <span className="opacity-60">N/A</span>}
                                </div>
                              </div>
                            </div>
                            {/* Horizontal Progress Bar */}
                            <div className="flex items-center justify-between mt-2 px-4 md:px-8">
                              <div className="flex-1 h-2 bg-muted/50 rounded-full relative overflow-hidden">
                                <div
                                  className="absolute top-0 left-0 h-2 bg-primary transition-all"
                                  style={{
                                    width:
                                      queue.shippedAt ||
                                        queue.status === "COMPLETED"
                                        ? "100%"
                                        : queue.createdAt
                                          ? "67%"
                                          : queue.labelCreatedAt
                                            ? "33%"
                                            : "0%",
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-4 md:px-8">
                              <span>Label</span>
                              <span>Belt</span>
                              <span>Shipped</span>
                            </div>
                          </div>
                          <Separator className="my-2" />
                          <div className="space-y-1">
                            <div className="font-medium text-xs mb-1">Pharmacist Review</div>
                            <div className="flex flex-col gap-1.5">
                              {queue.PharmacistReview !== null && queue.PharmacistReview?.length > 0 ? (
                                queue.PharmacistReview.map((review: any, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1"
                                  >
                                    <PharmacistReviewStatus status={review.status} />
                                    <div className="flex flex-col min-w-0 w-full">
                                      <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-between">
                                        {review.ReviewBy?.name ? (
                                          <div>By{" "}<span className="font-bold">{review.ReviewBy.name}</span></div>
                                        ) : (
                                          <span className="italic opacity-70">No name</span>
                                        )}
                                        {review.createdAt && (
                                          <span className="ml-2 text-xs text-muted-foreground">
                                            {formatDate(review.createdAt)}
                                          </span>
                                        )}
                                      </div>
                                      {review.reason && (
                                        <span className="wrap-break-word break-all text-[11px] text-destructive/80 italic mt-0.5 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                                          Reason: {review.reason}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-2 rounded bg-muted/20 px-2 py-1">
                                  <PharmacistReviewStatus status="PENDING" />
                                  <span className="text-xs text-muted-foreground">Pending review</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-auto border-t border-border/50 pt-4 flex flex-wrap justify-end m-4 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer gap-1"
                            onClick={() => {
                              setQueue(queue);
                              setViewItemsOpen(true);
                            }}
                          >
                            <Pill className="h-4 w-4" />
                            View Items
                          </Button>
                          {queue.status !== "PENDING" && !["SENT_TO_BELT", "STAGE1"].includes(queue.status) && (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="cursor-pointer"
                                    onClick={() => {
                                      setQueue(queue);
                                      setPushBackToStage1Open(true);
                                    }}
                                  >
                                    <SkipBack className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Push Back to Stage 1</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {queue.status !== "PENDING" && ["STAGE2", "STAGE3"].includes(queue.status) && (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="cursor-pointer"
                                    onClick={() => {
                                      setQueue(queue);
                                      setCompleteOrderOpen(true);
                                    }}
                                  >
                                    <CheckCheck className="h-4 w-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Push Completed</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {queue.status !== "PENDING" && queue.affiliateId === -1 &&
                            queue.status === "COMPLETED" && (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="cursor-pointer"
                                      onClick={() => {
                                        setQueue(queue);
                                        setUpdateLymlightStatusOpen(true);
                                      }}
                                    >
                                      <Radar className="h-4 w-4 text-violet-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Update Lymlight Status</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          {queue.status !== "PENDING" && (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="cursor-pointer text-destructive"
                                    onClick={() => {
                                      setQueue(queue);
                                      setDeleteFromBeltOpen(true);
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete from Belt</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {queue.status !== "PENDING" && (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="cursor-pointer"
                                    onClick={() => openQueueDetails(queue)}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </>
                    )}
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {
            totalPages > 1 && (<div className="mt-6">
              <PageNumber
                scrollToTop={true}
                paginationButtonRange={2}
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
            )
          }
        </CardContent>
      </Card>
    </>
  );
}
