"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { belts } from "@/lib/const";

interface BeltPerformanceProps {
  data: Array<{
    beltCode: string;
    count: number;
  }>;
}

export function BeltPerformance({ data }: BeltPerformanceProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card className="border-0 shadow-md h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Belt Performance Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {belts.map((belt) => {
            const performance = data.find(d => d.beltCode === belt);
            const count = performance?.count || 0;

            const percentage = (count / maxCount) * 100;

            return (
              <div key={belt} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 transition-all hover:shadow-md dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                      <span className="text-lg font-bold">{belt}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Belt {belt}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">orders</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Math.round(percentage)}%
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}