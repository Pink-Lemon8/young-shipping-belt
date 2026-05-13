"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PageNumber from "@/components/common/pagination-page";
import Search from "@/components/pages/management/process-view/search";
import { Status } from "@/components/pages/management/process-view/status";
import { cn, formatDate } from "@/lib/utils";
import { FileList } from "@/components/pages/pharmacist-review/data/file-list";
import { beltQueueStatusTypes } from "@/db/schema";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type OrderListDataProps = {
  queues?: any[];
  length?: number;
  totalPages?: number;
  maxOnPage?: number;
  groupIdToOrderIds?: Record<number, string[]>;
  statusValue?: string;
  isCvValue?: string;
};

type MergedRow = { main: any; groupMembers: any[] };

function mergeQueuesByGroup(queues: any[]): MergedRow[] {
  const hasGroup = (queue: any) =>
    queue.groupId != null &&
    queue.groupId !== "" &&
    queue.groupId !== -1 &&
    queue.groupId !== "-1";

  const rows: MergedRow[] = [];
  const seenGroupIds = new Set<string | number>();

  for (const queue of queues) {
    if (!hasGroup(queue)) {
      rows.push({ main: queue, groupMembers: [] });
      continue;
    }

    const groupId = queue.groupId;
    if (seenGroupIds.has(groupId)) continue;

    seenGroupIds.add(groupId);
    const groupMembers = queues.filter(
      (item) =>
        hasGroup(item) &&
        (item.groupId === groupId || item.groupId === Number(groupId)),
    );
    const [main, ...rest] = groupMembers;

    rows.push({ main: main ?? queue, groupMembers: rest });
  }

  return rows;
}

const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  PENDING: "Pending (Incoming YY)",
  SENT_TO_BELT: "Sent to belt",
  STAGE1: "Stage 1",
  STAGE2: "Stage 2",
  STAGE3: "Stage 3",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  ...beltQueueStatusTypes.map((value) => ({
    label:
      STATUS_LABEL_OVERRIDES[value] ??
      value.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()),
    value,
  })),
];

const CV_OPTIONS = [
  { label: "All orders", value: "all" },
  { label: "Young only", value: "true" },
  { label: "Non-Young only", value: "false" },
] as const;

export default function OrderListData({
  queues = [],
  length = 0,
  totalPages = 1,
  maxOnPage = 15,
  groupIdToOrderIds = {},
  statusValue,
  isCvValue,
}: OrderListDataProps) {
  const mergedRows = useMemo(() => mergeQueuesByGroup(queues), [queues]);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [currentPage, setCurrentPage] = useState(
    Number.parseInt(searchParams.get("page") ?? "1"),
  );

  const currentStatus =
    statusValue && statusValue.length > 0 ? statusValue : "all";
  const currentIsCv = isCvValue && isCvValue.length > 0 ? isCvValue : "all";

  const [filesOpen, setFilesOpen] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<any[]>([]);
  const [currentFilesTitle, setCurrentFilesTitle] = useState<string>("");

  useEffect(() => {
    setLoading(true);
  }, [search, currentPage, maxOnPage, currentStatus, currentIsCv]);

  useEffect(() => {
    setLoading(false);
  }, [queues]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const openFiles = (queue: any) => {
    const files = [
      ...(Array.isArray(queue.cvFiles) ? queue.cvFiles : []),
      ...(Array.isArray(queue.extraFiles) ? queue.extraFiles : []),
      ...(Array.isArray(queue.files) ? queue.files : []),
    ].filter(
      (f: any) =>
        f && (f.key || f.url) && typeof f.name === "string" && f.name.length > 0,
    );
    setCurrentFiles(files);
    setCurrentFilesTitle(
      `Files for order ${queue.fullOrderId ?? queue.orderId}`,
    );
    setFilesOpen(true);
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="sr-only">Order List</CardTitle>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search
              searchText={search}
              setSearchText={setSearch}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              placeholder="Search by Order ID, Patient ID, or Tracking Number"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={currentStatus}
              onValueChange={(v) => updateParam("status", v)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentIsCv}
              onValueChange={(v) => updateParam("isCv", v)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="YY" />
              </SelectTrigger>
              <SelectContent>
                {CV_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center sm:justify-start">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Showing <span className="font-medium">{length}</span> results
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
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
          ) : mergedRows.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold text-primary mb-2">
                No Orders to Show
              </span>
              <span className="text-base text-muted-foreground">
                Try changing your search or check again later.
              </span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border/60">
                  <TableHead className="px-4 py-3 whitespace-nowrap">
                    Order ID
                  </TableHead>
                  <TableHead className="px-4 py-3 whitespace-nowrap">
                    Patient ID
                  </TableHead>
                  <TableHead className="px-4 py-3 whitespace-nowrap">
                    Patient Name
                  </TableHead>
                  <TableHead className="px-4 py-3 whitespace-nowrap">
                    Tracking Number
                  </TableHead>
                  <TableHead className="px-4 py-3 whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-3 whitespace-nowrap">
                    Files
                  </TableHead>
                  <TableHead className="px-4 py-3 whitespace-nowrap">
                    Sent to Belt
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {mergedRows.map((row) => {
                  const queue = row.main;
                  const isGroup = row.groupMembers.length > 0;
                  const orderIdsInGroup = isGroup
                    ? [
                      queue.orderId,
                      ...row.groupMembers.map((member: any) => member.orderId),
                    ]
                    : [];
                  const orderIdsForTooltip =
                    isGroup &&
                      queue.groupId != null &&
                      groupIdToOrderIds[queue.groupId]?.length
                      ? groupIdToOrderIds[queue.groupId]
                      : orderIdsInGroup;

                  const patientIds = [
                    queue.patientId,
                    ...row.groupMembers.map((member: any) => member.patientId),
                  ].filter(
                    (value: string, index: number, items: string[]) =>
                      value && items.indexOf(value) === index,
                  );

                  const patientNames = [
                    queue.patientName,
                    ...row.groupMembers.map((member: any) => member.patientName),
                  ].filter(
                    (value: string, index: number, items: string[]) =>
                      value && items.indexOf(value) === index,
                  );

                  const fileCount =
                    (Array.isArray(queue.cvFiles) ? queue.cvFiles.length : 0) +
                    (Array.isArray(queue.extraFiles)
                      ? queue.extraFiles.length
                      : 0) +
                    (Array.isArray(queue.files) ? queue.files.length : 0);

                  return (
                    <TableRow
                      key={queue.id}
                      className={cn(
                        "border-border/40 transition-colors",
                        isGroup && "bg-amber-500/5 dark:bg-amber-700/10",
                        queue.status === "PENDING" &&
                        "bg-emerald-50/60 dark:bg-emerald-900/10",
                      )}
                    >
                      <TableCell className="font-medium px-4 py-3">
                        {isGroup ? (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help truncate">
                                  G-{queue.groupId}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="font-medium">Order IDs</p>
                                <p className="text-sm break-all">
                                  {orderIdsForTooltip.join(", ")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span>{queue.fullOrderId ?? queue.orderId}</span>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {isGroup ? patientIds.join(", ") : queue.patientId}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {isGroup
                          ? patientNames.join(", ")
                          : (queue.patientName ?? "N/A")}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-primary font-semibold">
                        {queue.trackingNumber || "N/A"}
                      </TableCell>

                      <TableCell className="px-4 py-3 min-w-[140px]">
                        <Status status={queue.status} />
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openFiles(queue)}
                          disabled={fileCount === 0}
                          className="gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          {fileCount > 0 ? fileCount : "-"}
                        </Button>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(queue.createdAt) || "N/A"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center border-t border-border/40">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <span className="text-sm font-medium text-muted-foreground mb-1">
                Loading ...
              </span>
            </div>
          ) : mergedRows.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold text-primary mb-2">
                No Orders to Show
              </span>
              <span className="text-base text-muted-foreground">
                Try changing your search or check again later.
              </span>
            </div>
          ) : (
            mergedRows.map((row) => {
              const queue = row.main;
              const isGroup = row.groupMembers.length > 0;
              const patientIds = [
                queue.patientId,
                ...row.groupMembers.map((member: any) => member.patientId),
              ].filter(
                (value: string, index: number, items: string[]) =>
                  value && items.indexOf(value) === index,
              );

              const fileCount =
                (Array.isArray(queue.cvFiles) ? queue.cvFiles.length : 0) +
                (Array.isArray(queue.extraFiles) ? queue.extraFiles.length : 0) +
                (Array.isArray(queue.files) ? queue.files.length : 0);

              return (
                <Card
                  key={queue.id}
                  className={cn(
                    "border border-border/50 shadow-sm",
                    isGroup && "border-amber-500/30 bg-amber-500/5",
                    queue.status === "PENDING" &&
                    "border-emerald-500/30 bg-emerald-50/40",
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                          Order
                        </div>
                        <div className="font-semibold truncate">
                          {isGroup
                            ? `G-${queue.groupId}`
                            : (queue.fullOrderId ?? queue.orderId)}
                        </div>
                      </div>

                      <Status status={queue.status} />
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Patient ID:{" "}
                        </span>
                        <span>
                          {isGroup ? patientIds.join(", ") : queue.patientId}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Patient Name:{" "}
                        </span>
                        <span>{queue.patientName ?? "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Tracking:{" "}
                        </span>
                        <span>{queue.trackingNumber || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Sent to Belt:{" "}
                        </span>
                        <span>{formatDate(queue.createdAt) || "N/A"}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFiles(queue)}
                      disabled={fileCount === 0}
                      className="w-full gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      {fileCount > 0
                        ? `View ${fileCount} file${fileCount === 1 ? "" : "s"}`
                        : "No files"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-6">
            <PageNumber
              scrollToTop={true}
              paginationButtonRange={2}
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </div>
        ) : null}
      </CardContent>

      <Dialog open={filesOpen} onOpenChange={setFilesOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogTitle className="sr-only">{currentFilesTitle}</DialogTitle>
          <FileList files={currentFiles} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
