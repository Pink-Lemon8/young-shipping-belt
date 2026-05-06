"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cages } from "@/lib/const";

interface CageDistributionProps {
  data: Array<{
    cage: number;
    count: number;
  }>;
}

export function CageDistribution({ data }: CageDistributionProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card className="border-0 shadow-md h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Cage Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cages.map((cageNum: string) => {
            const cageData = data.find(d => d.cage === parseInt(cageNum));
            const count = cageData?.count || 0;
            const percentage = (count / maxCount) * 100;

            return (
              <div key={cageNum} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cage {cageNum}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {count} orders
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {count > 0 ? `${Math.round(percentage)}%` : "0%"}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}