"use client";

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
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { cages } from "@/lib/const";

interface CageDistributionDialogProps {
  data: Array<{
    cage: number;
    count: number;
  }>;
}

export function CageDistributionDialog({ data }: CageDistributionDialogProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalOrders = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-3 border-dashed border-2 hover:border-solid hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
        >
          <Boxes className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              View Cage Distribution
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalOrders} Orders
            </p>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cage Distribution Overview</DialogTitle>
          <DialogDescription>
            Current distribution of orders across shipping cages
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Cages
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.filter((d) => d.count > 0).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Orders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalOrders}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 overflow-y-auto max-h-[calc(80vh-200px)]">
          {cages.map((cageNum: string) => {
            const cageData = data.find((d: any) => d.cage === parseInt(cageNum));
            const count = cageData?.count || 0;
            const percentage =
              totalOrders > 0 ? (count / totalOrders) * 100 : 0;
            const fillPercentage = (count / maxCount) * 100;

            return (
              <Card
                key={cageNum}
                className={cn(
                  "relative overflow-hidden flex flex-col justify-between p-4 transition-all hover:shadow-md min-h-[120px]",
                  count > 0
                    ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
                    : ""
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cage {cageNum}
                  </h3>
                  <div className="flex items-center gap-2">
                    {count > 20 && (
                      <div className="">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          High Volume
                        </span>
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        count > 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 dark:text-gray-600",
                      )}
                    >
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {count}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      orders
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
