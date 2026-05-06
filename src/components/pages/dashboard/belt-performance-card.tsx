"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface BeltPerformanceCardProps {
  data: Array<{
    beltCode: string;
    count: number;
  }>;
}

export function BeltPerformanceCard({ data }: BeltPerformanceCardProps) {
  // Filter out belts with 0 orders
  const activeBelts = data.filter((b) => b.count > 0);
  const totalOrders = activeBelts.reduce((sum, b) => sum + b.count, 0);

  if (activeBelts.length === 0) {
    return (
      <Card className="h-full min-h-[120px] border-0 shadow-md">
        <CardContent className="flex h-full items-center justify-center p-6">
          <div className="text-center">
            <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">No belt activity today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[120px] border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Belt Performance Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeBelts.map((belt) => {
          const percentage = (belt.count / totalOrders) * 100;

          return (
            <div
              key={belt.beltCode}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                  <span className="text-lg font-bold">{belt.beltCode}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Belt {belt.beltCode}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {belt.count}
                </p>
                <p className="text-xs text-gray-500">
                  {percentage.toFixed(0)}% of total
                </p>
              </div>
            </div>
          );
        })}
        {totalOrders > 0 && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Orders
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {totalOrders}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
