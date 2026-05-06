"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Activity, Loader2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { cn } from "@/lib/utils";

// SWR fetcher (Rule 4.2)
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface HourlyDataItem {
  hour: number;
  hourLabel: string;
  sentToBelt: number;
  stage3: number;
  completed: number;
}

interface HourlyDistributionDialogProps {
  hourlyDistribution?: {
    data: Array<HourlyDataItem>;
    totalDays: number;
    periodStart: Date;
    periodEnd: Date;
  };
}

export function HourlyDistributionDialog({ hourlyDistribution }: HourlyDistributionDialogProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "7days" | "30days">("30days");

  // Use SWR for automatic deduplication and caching (Rule 4.2)
  const { data: fetchedData, isLoading: isPending } = useSWR(
    `/api/dashboard/hourly-distribution/${selectedPeriod}`,
    fetcher,
    {
      revalidateOnFocus: false,
      fallbackData: hourlyDistribution
    }
  );

  const currentData = fetchedData || hourlyDistribution;

  // Use real data or generate mock data
  const data: HourlyDataItem[] = currentData?.data || hourlyDistribution?.data || Array.from({ length: 12 }, (_, i) => ({
    hour: i + 5,
    hourLabel: `${(i + 5).toString().padStart(2, '0')}:00`,
    sentToBelt: Math.floor(Math.random() * 50) + 10,
    stage3: Math.floor(Math.random() * 40) + 5,
    completed: Math.floor(Math.random() * 35) + 5
  }));

  const totalSentToBelt = data.reduce((sum, d) => sum + d.sentToBelt, 0);
  const totalStage3 = data.reduce((sum, d) => sum + d.stage3, 0);
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
  const avgPerHour = Math.round(totalSentToBelt / data.length);
  const peakHour = data.reduce((max, d) => d.sentToBelt > max.sentToBelt ? d : max, data[0]);

  const handlePeriodChange = (period: "today" | "7days" | "30days") => {
    setSelectedPeriod(period);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-full w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
        >
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Pattern</span>
              <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {selectedPeriod === "today" ? "today" : selectedPeriod === "7days" ? "last 7 days" : "last 30 days"}
              </span>
            </div>

            <div className="mt-2 text-left">
              <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {avgPerHour}
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Orders per hour avg
              </p>
            </div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Average Hourly Order Flow</DialogTitle>
              <DialogDescription className="mt-1">
                Average number of orders at each stage per hour (5 AM - 4 PM)
              </DialogDescription>
            </div>
            <div className="flex gap-2 mr-2 mt-2">
              <Button
                variant={selectedPeriod === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange("today")}
                disabled={isPending}
                className={cn(
                  selectedPeriod === "today" && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                Today
              </Button>
              <Button
                variant={selectedPeriod === "7days" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange("7days")}
                disabled={isPending}
                className={cn(
                  selectedPeriod === "7days" && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                Last 7 Days
              </Button>
              <Button
                variant={selectedPeriod === "30days" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange("30days")}
                disabled={isPending}
                className={cn(
                  selectedPeriod === "30days" && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                Last 30 Days
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
              <p className="text-sm text-gray-600 dark:text-gray-400">Sent to Belt (Daily Avg)</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalSentToBelt}</p>
              <p className="text-xs text-gray-500">orders per day</p>
            </Card>
            <Card className="p-4 border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
              <p className="text-sm text-gray-600 dark:text-gray-400">Reached Stage 3</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalStage3}</p>
              <p className="text-xs text-gray-500">orders per day</p>
            </Card>
            <Card className="p-4 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed to Cage</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalCompleted}</p>
              <p className="text-xs text-gray-500">orders per day</p>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-6">
            {isPending ? (
              <div className="flex h-[350px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hourLabel"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Time
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {payload[0].payload.hourLabel}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Avg Orders
                                </span>
                                <span className="font-bold">
                                  {payload[0].value}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <defs>
                    <linearGradient id="sentToBeltGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="stage3Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="sentToBelt"
                    stroke="#3B82F6"
                    fill="url(#sentToBeltGradient)"
                    strokeWidth={2}
                    name="Sent to Belt"
                  />
                  <Area
                    type="monotone"
                    dataKey="stage3"
                    stroke="#A855F7"
                    fill="url(#stage3Gradient)"
                    strokeWidth={2}
                    name="Stage 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10B981"
                    fill="url(#completedGradient)"
                    strokeWidth={2}
                    name="Completed"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Note */}
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Note:</span> Shows {
                selectedPeriod === "today" ? "today's" :
                  selectedPeriod === "7days" ? "average" :
                    "average"
              } order flow through the system per hour.
              {selectedPeriod !== "today" && (
                <>Based on {currentData?.totalDays || (selectedPeriod === "7days" ? 7 : 30)} days of data, excluding days with no orders.</>
              )}
            </p>
          </div>

          {/* Peak Hour Info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Peak Hour:</span> {peakHour.hourLabel} with an average of {peakHour.sentToBelt} orders sent to belt
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}