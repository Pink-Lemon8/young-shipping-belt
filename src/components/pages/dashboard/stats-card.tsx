"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        {Icon && (
          <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
            <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            <span
              className={cn(
                "text-xs font-semibold",
                trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              vs yesterday
            </span>
          </div>
        )}
      </CardContent>
      {/* Decorative element */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 opacity-10 dark:from-gray-700 dark:to-gray-800" />
    </Card>
  );
}