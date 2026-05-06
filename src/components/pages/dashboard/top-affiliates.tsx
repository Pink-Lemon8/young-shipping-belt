"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TopAffiliatesProps {
  data: Array<{
    affiliateId: number;
    affiliateName: string | null;
    orderCount: number;
  }>;
}

export function TopAffiliates({ data }: TopAffiliatesProps) {
  return (
    <Card className="border-0 shadow-md h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Affiliates Today
        </CardTitle>
        <CardDescription>
          Total orders:{" "}
          {data.reduce((sum, affiliate) => sum + affiliate.orderCount, 0)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No affiliate data available
            </p>
          ) : (
            data.map((affiliate, index) => (
              <div
                key={affiliate.affiliateId}
                className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-700">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                        {affiliate.affiliateName?.charAt(0).toUpperCase() ||
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white",
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                            ? "bg-gray-400"
                            : index === 2
                              ? "bg-orange-600"
                              : "bg-gray-600"
                      )}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {affiliate.affiliateName ||
                        `Affiliate ${affiliate.affiliateId === -1 ? "in Lymlight" : affiliate.affiliateId}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID:{" "}
                      {affiliate.affiliateId === -1
                        ? "---"
                        : affiliate.affiliateId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {affiliate.orderCount}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    orders
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
