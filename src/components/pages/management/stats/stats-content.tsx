"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  RefreshCw,
  Users,
  BarChart3,
  Clock,
  CalendarDays,
  Calendar,
  CalendarRange,
  ShieldCheck,
  SkipForward,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useCallback } from "react";
import { refreshLeaderboardData } from "./action";
import type { StatsPeriod, StatsDateRange } from "@/server/controller/users";
import { Navbar } from "@/components/layout/management/sidebar/navbar";

type LeaderboardEntry = {
  rank: number;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  beltCode: string | null;
  count: number;
};

type PharmacistEntry = {
  rank: number;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  approved: number;
  denied: number;
  total: number;
};

type SkipEntry = {
  rank: number;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  beltCode: string | null;
  skipped: number;
  unskipped: number;
  total: number;
};

type StatsContentProps = {
  stage1Data: LeaderboardEntry[];
  stage2Data: LeaderboardEntry[];
  stage3Data: LeaderboardEntry[];
  totalCompletedToday: number;
  pharmacistData: PharmacistEntry[];
  skipData: SkipEntry[];
  totalSkipped: number;
  totalQueued: number;
  currentUserId?: string | null;
};

export default function StatsContent({
  stage1Data: initialStage1Data,
  stage2Data: initialStage2Data,
  stage3Data: initialStage3Data,
  totalCompletedToday: initialTotalCompleted,
  pharmacistData: initialPharmacistData,
  skipData: initialSkipData,
  totalSkipped: initialTotalSkipped,
  totalQueued: initialTotalQueued,
  currentUserId,
}: StatsContentProps) {
  const [period, setPeriod] = useState<StatsPeriod>("today");
  const [customFrom, setCustomFrom] = useState<Date>(new Date());
  const [customTo, setCustomTo] = useState<Date>(new Date());
  const [stage1Data, setStage1Data] = useState(initialStage1Data);
  const [stage2Data, setStage2Data] = useState(initialStage2Data);
  const [stage3Data, setStage3Data] = useState(initialStage3Data);
  const [totalCompleted, setTotalCompleted] = useState(initialTotalCompleted);
  const [pharmacistData, setPharmacistData] = useState(initialPharmacistData);
  const [skipData, setSkipData] = useState(initialSkipData);
  const [totalSkipped, setTotalSkipped] = useState(initialTotalSkipped);
  const [totalQueued, setTotalQueued] = useState(initialTotalQueued);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(
    async (p: StatsPeriod, dateRange?: StatsDateRange) => {
      setIsRefreshing(true);
      const result = await refreshLeaderboardData(p, dateRange);

      if (result.success && result.data) {
        setStage1Data(result.data.stage1Data);
        setStage2Data(result.data.stage2Data);
        setStage3Data(result.data.stage3Data);
        setTotalCompleted(result.data.totalCompleted);
        setPharmacistData(result.data.pharmacistData);
        setSkipData(result.data.skipData);
        setTotalSkipped(result.data.totalSkipped);
        setTotalQueued(result.data.totalQueued);
      }

      setIsRefreshing(false);
    },
    []
  );

  const handleRefresh = () => {
    if (period === "custom") {
      fetchData("custom", { from: customFrom.toISOString(), to: customTo.toISOString() });
    } else {
      fetchData(period);
    }
  };

  const handlePeriodChange = (value: string) => {
    const newPeriod = value as StatsPeriod;
    setPeriod(newPeriod);
    if (newPeriod !== "custom") {
      fetchData(newPeriod);
    }
  };

  const handleCustomSearch = () => {
    fetchData("custom", {
      from: customFrom.toISOString(),
      to: customTo.toISOString(),
    });
  };

  const totalProcessed =
    stage1Data.reduce((sum, e) => sum + e.count, 0) +
    stage2Data.reduce((sum, e) => sum + e.count, 0) +
    stage3Data.reduce((sum, e) => sum + e.count, 0);

  const uniqueOperators = new Set([
    ...stage1Data.map((e) => e.userId),
    ...stage2Data.map((e) => e.userId),
    ...stage3Data.map((e) => e.userId),
  ]).size;

  const renderTableSkeleton = (rows: number = 4) => (
    <div className="space-y-0">
      <div className="flex items-center border-b pb-3 gap-4">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-10 ml-auto" />
        <Skeleton className="h-4 w-12" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center py-3 border-b last:border-0 gap-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-8 rounded ml-auto" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  );

  const renderTable = (data: LeaderboardEntry[]) => {
    if (isRefreshing) return renderTableSkeleton();

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Package className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No data for this period</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium w-12">#</th>
              <th className="pb-3 pr-4 font-medium">Operator</th>
              <th className="pb-3 pr-4 font-medium">Belt</th>
              <th className="pb-3 font-medium text-right">Orders</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr
                key={`${entry.userId}-${entry.rank}`}
                className={cn(
                  "border-b last:border-0 transition-colors",
                  entry.userId === currentUserId && "bg-primary/5",
                  entry.rank <= 3 && "font-medium"
                )}
              >
                <td className="py-3 pr-4">
                  {entry.rank <= 3 ? (
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white",
                        entry.rank === 1 && "bg-yellow-500",
                        entry.rank === 2 && "bg-gray-400",
                        entry.rank === 3 && "bg-orange-400"
                      )}
                    >
                      {entry.rank}
                    </span>
                  ) : (
                    <span className="text-muted-foreground pl-1.5">
                      {entry.rank}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[180px]">
                      {entry.userName}
                    </span>
                    {entry.userId === currentUserId && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        You
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {entry.beltCode ? (
                    <Badge variant="secondary" className="text-xs">
                      {entry.beltCode}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 text-right tabular-nums font-semibold">
                  {entry.count.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <Navbar title="Operator Stats" />
      <main className="flex-1 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Period Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Tabs value={period} onValueChange={handlePeriodChange}>
              <TabsList>
                <TabsTrigger value="today" className="gap-1.5" disabled={isRefreshing}>
                  <Clock className="h-3.5 w-3.5" />
                  Today
                </TabsTrigger>
                <TabsTrigger value="7days" className="gap-1.5" disabled={isRefreshing}>
                  <CalendarDays className="h-3.5 w-3.5" />
                  7 Days
                </TabsTrigger>
                <TabsTrigger value="30days" className="gap-1.5" disabled={isRefreshing}>
                  <Calendar className="h-3.5 w-3.5" />
                  30 Days
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-1.5" disabled={isRefreshing}>
                  <CalendarRange className="h-3.5 w-3.5" />
                  Custom
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {period === "custom" && (
              <div className="flex items-center gap-2 flex-wrap">
                <DatePicker
                  value={customFrom}
                  onChange={setCustomFrom}
                  toDate={customTo}
                  disabled={isRefreshing}
                  className="w-[180px]"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <DatePicker
                  value={customTo}
                  onChange={setCustomTo}
                  fromDate={customFrom}
                  toDate={new Date()}
                  disabled={isRefreshing}
                  className="w-[180px]"
                />
                <Button
                  size="sm"
                  onClick={handleCustomSearch}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Apply
                </Button>
              </div>
            )}

            <div className="sm:ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sent to Belt
                </CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRefreshing ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold tabular-nums">
                      {totalQueued.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added to queue
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed Orders
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRefreshing ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold tabular-nums">
                      {totalCompleted.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pushed to cage
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Processed
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRefreshing ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold tabular-nums">
                      {totalProcessed.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Across all stages
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pharmacist Reviews
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRefreshing ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-36" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold tabular-nums">
                      {pharmacistData
                        .reduce((s, e) => s + e.total, 0)
                        .toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pharmacistData.reduce((s, e) => s + e.approved, 0).toLocaleString()} approved,{" "}
                      {pharmacistData.reduce((s, e) => s + e.denied, 0).toLocaleString()} denied
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Operators
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRefreshing ? (
                  <>
                    <Skeleton className="h-8 w-12 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold tabular-nums">
                      {uniqueOperators}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      With activity in period
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Skipped Orders
                </CardTitle>
                <SkipForward className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRefreshing ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold tabular-nums">
                      {totalSkipped.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Unique orders skipped
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stage Tables */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Stage 1 → 2</CardTitle>
                  {isRefreshing ? (
                    <Skeleton className="h-5 w-20 rounded-full" />
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      {stage1Data.reduce((s, e) => s + e.count, 0).toLocaleString()} orders
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>{renderTable(stage1Data)}</CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Stage 2 → 3</CardTitle>
                  {isRefreshing ? (
                    <Skeleton className="h-5 w-20 rounded-full" />
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      {stage2Data.reduce((s, e) => s + e.count, 0).toLocaleString()} orders
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>{renderTable(stage2Data)}</CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Stage 3 → Cage</CardTitle>
                  {isRefreshing ? (
                    <Skeleton className="h-5 w-20 rounded-full" />
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      {stage3Data.reduce((s, e) => s + e.count, 0).toLocaleString()} orders
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>{renderTable(stage3Data)}</CardContent>
            </Card>
          </div>

          {/* Pharmacist Reviews & Skipped Orders */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Pharmacist Reviews
                  </CardTitle>
                  {isRefreshing ? (
                    <Skeleton className="h-5 w-20 rounded-full" />
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      {pharmacistData.reduce((s, e) => s + e.total, 0).toLocaleString()} reviews
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isRefreshing ? (
                  <div className="space-y-0">
                    <div className="flex items-center border-b pb-3 gap-4">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-16 ml-auto" />
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center py-3 border-b last:border-0 gap-4">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-10 ml-auto" />
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    ))}
                  </div>
                ) : pharmacistData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <ShieldCheck className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No pharmacist reviews for this period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium w-12">#</th>
                          <th className="pb-3 pr-4 font-medium">Pharmacist</th>
                          <th className="pb-3 font-medium text-right">Approved</th>
                          <th className="pb-3 font-medium text-right">Denied</th>
                          <th className="pb-3 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pharmacistData.map((entry) => (
                          <tr
                            key={`pharma-${entry.userId}-${entry.rank}`}
                            className={cn(
                              "border-b last:border-0 transition-colors",
                              entry.userId === currentUserId && "bg-primary/5",
                              entry.rank <= 3 && "font-medium"
                            )}
                          >
                            <td className="py-3 pr-4">
                              {entry.rank <= 3 ? (
                                <span
                                  className={cn(
                                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white",
                                    entry.rank === 1 && "bg-yellow-500",
                                    entry.rank === 2 && "bg-gray-400",
                                    entry.rank === 3 && "bg-orange-400"
                                  )}
                                >
                                  {entry.rank}
                                </span>
                              ) : (
                                <span className="text-muted-foreground pl-1.5">
                                  {entry.rank}
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-[240px]">
                                  {entry.userName}
                                </span>
                                {entry.userId === currentUserId && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    You
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right tabular-nums text-green-600 dark:text-green-400 font-semibold">
                              {entry.approved.toLocaleString()}
                            </td>
                            <td className="py-3 text-right tabular-nums text-red-600 dark:text-red-400 font-semibold">
                              {entry.denied.toLocaleString()}
                            </td>
                            <td className="py-3 text-right tabular-nums font-semibold">
                              {entry.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <SkipForward className="h-4 w-4" />
                    Skipped Orders
                  </CardTitle>
                  {isRefreshing ? (
                    <Skeleton className="h-5 w-20 rounded-full" />
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      {totalSkipped.toLocaleString()} skipped
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isRefreshing ? (
                  <div className="space-y-0">
                    <div className="flex items-center border-b pb-3 gap-4">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-14 ml-auto" />
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center py-3 border-b last:border-0 gap-4">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-10 ml-auto" />
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    ))}
                  </div>
                ) : skipData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <SkipForward className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No skip activity for this period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium w-12">#</th>
                          <th className="pb-3 pr-4 font-medium">Operator</th>
                          <th className="pb-3 font-medium text-right">Skipped</th>
                          <th className="pb-3 font-medium text-right">Unskipped</th>
                          <th className="pb-3 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skipData.map((entry) => (
                          <tr
                            key={`skip-${entry.userId}-${entry.rank}`}
                            className={cn(
                              "border-b last:border-0 transition-colors",
                              entry.userId === currentUserId && "bg-primary/5",
                              entry.rank <= 3 && "font-medium"
                            )}
                          >
                            <td className="py-3 pr-4">
                              {entry.rank <= 3 ? (
                                <span
                                  className={cn(
                                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white",
                                    entry.rank === 1 && "bg-yellow-500",
                                    entry.rank === 2 && "bg-gray-400",
                                    entry.rank === 3 && "bg-orange-400"
                                  )}
                                >
                                  {entry.rank}
                                </span>
                              ) : (
                                <span className="text-muted-foreground pl-1.5">
                                  {entry.rank}
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-[180px]">
                                  {entry.userName}
                                </span>
                                {entry.beltCode && (
                                  <Badge variant="secondary" className="text-xs">
                                    {entry.beltCode}
                                  </Badge>
                                )}
                                {entry.userId === currentUserId && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    You
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right tabular-nums text-orange-600 dark:text-orange-400 font-semibold">
                              {entry.skipped.toLocaleString()}
                            </td>
                            <td className="py-3 text-right tabular-nums text-green-600 dark:text-green-400 font-semibold">
                              {entry.unskipped.toLocaleString()}
                            </td>
                            <td className="py-3 text-right tabular-nums font-semibold">
                              {entry.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
