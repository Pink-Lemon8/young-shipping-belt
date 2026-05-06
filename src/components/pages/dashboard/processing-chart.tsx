"use client";

import * as React from "react";
import useSWR from "swr";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Loader2 } from "lucide-react";

// SWR fetcher (Rule 4.2)
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ProcessingChartProps {
  data: Array<{
    hour: number;
    count: number;
  }>;
}

const chartConfig = {
  count: {
    label: "Orders",
  },
  today: {
    label: "Today",
    color: "hsl(var(--chart-2))",
  },
  sevenDays: {
    label: "Last 7 Days",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function ProcessingChart({
  initialData,
}: {
  initialData: ProcessingChartProps["data"];
}) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("today");

  // Fetch 7-day series on mount so the "Last 7 Days" total isn’t stuck at 0 until click
  const { data: sevenDaysData, isLoading: isLoadingSevenDays } = useSWR(
    "/api/dashboard/weekly-hourly-stats",
    fetcher,
    { revalidateOnFocus: false },
  );

  // Format today's data - 24 hours
  const todayData = React.useMemo(() => {
    return initialData.map((item) => ({
      time: `${item.hour.toString().padStart(2, "0")}:00`,
      today: item.count,
      sevenDays: 0,
    }));
  }, [initialData]);

  const chartData =
    activeChart === "today"
      ? todayData
      : Array.isArray(sevenDaysData)
        ? sevenDaysData
        : [];

  const total = React.useMemo(
    () => ({
      today: todayData.reduce((acc: number, curr) => acc + curr.today, 0),
      sevenDays: Array.isArray(sevenDaysData)
        ? sevenDaysData.reduce(
          (acc: number, curr: { sevenDays: number }) =>
            acc + (curr.sevenDays ?? 0),
          0,
        )
        : 0,
    }),
    [todayData, sevenDaysData],
  );

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>Order Processing Timeline</CardTitle>
          <CardDescription>
            {activeChart === "today"
              ? "Hourly breakdown for today"
              : "Hourly breakdown for the last 7 days"}
          </CardDescription>
        </div>
        <div className="flex">
          {["today", "sevenDays"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {chart === "sevenDays" &&
                    isLoadingSevenDays &&
                    !Array.isArray(sevenDaysData)
                    ? "…"
                    : total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {isLoadingSevenDays && activeChart === "sevenDays" ? (
          <div className="flex h-[250px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              key={activeChart}
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={activeChart === "today" ? "time" : "datetime"}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  if (activeChart === "sevenDays") {
                    const [date, time] = value.split(" ");
                    const d = new Date(date);
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }
                  return value;
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="count"
                    labelFormatter={(value) => {
                      if (activeChart === "sevenDays") {
                        const [date, time] = value.split(" ");
                        return (
                          new Date(date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) +
                          " " +
                          time
                        );
                      }
                      return value;
                    }}
                  />
                }
              />
              <Bar dataKey={activeChart} fill={`var(--primary)`} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
