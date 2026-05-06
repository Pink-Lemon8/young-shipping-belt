"use client";

import { StatsCard } from "@/components/pages/dashboard/stats-card";
import { ActivityFeed } from "@/components/pages/dashboard/activity-feed";
import { CageDistributionDialog } from "@/components/pages/dashboard/cage-distribution-dialog";
import { BeltPerformanceCard } from "@/components/pages/dashboard/belt-performance-card";
import { HourlyDistributionDialog } from "@/components/pages/dashboard/hourly-distribution-dialog";
import { TopAffiliates } from "@/components/pages/dashboard/top-affiliates";
import { ProcessingChart } from "@/components/pages/dashboard/processing-chart";
import { RefreshButton } from "@/components/pages/dashboard/refresh-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  PackageOpen,
  AlertCircle,
  TrendingUp,
  Activity,
  Boxes,
  CalendarDays,
  Calendar,
  Eye,
  Search,
  BoxesIcon,
} from "lucide-react";
import { UserNav } from "@/components/layout/user-nav";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/auth-client";
import { useEffect, useState } from "react";

interface DashboardContentProps {
  dashboardStats: any;
  hourlyStats: any;
  hourlyDistribution: any;
  userName: string;
}

export function DashboardContent({
  dashboardStats,
  hourlyStats,
  hourlyDistribution,
  userName,
}: DashboardContentProps) {

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 rounded-b-xl ">
      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Dashboard Overview
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Real-time insights into your shipping operations
                </p>
              </div>
              <div className="flex flex-row flex-wrap items-center gap-4">
                <RefreshButton />
              </div>
            </div>
          </div>

          {/* Primary Stats */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
            <Card className="@container/card" data-slot="card">
              <CardHeader>
                <CardDescription>Completed Today</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {dashboardStats.todayStats.completed}
                </CardTitle>
                <div>
                  <Badge variant="outline">
                    {dashboardStats.trends?.todayTrend?.isPositive ? (
                      <IconTrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {dashboardStats.trends?.todayTrend?.isPositive ? "+" : "-"}
                    {dashboardStats.trends?.todayTrend?.value || 0}%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {dashboardStats.trends?.todayTrend?.isPositive ? (
                    <>
                      Above yesterday's count{" "}
                      <IconTrendingUp className="size-4" />
                    </>
                  ) : dashboardStats.trends?.todayTrend?.value === 0 ? (
                    <>Same as yesterday</>
                  ) : (
                    <>
                      Below yesterday's count{" "}
                      <IconTrendingDown className="size-4" />
                    </>
                  )}
                </div>
                <div className="text-muted-foreground">
                  Orders processed today
                </div>
              </CardFooter>
            </Card>
            <Card className="@container/card" data-slot="card">
              <CardHeader>
                <CardDescription>Approved Orders</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {dashboardStats.stageStats.approved}
                </CardTitle>
                <div>
                  <Badge variant="outline">
                    {dashboardStats.trends?.approvedTrend?.isPositive ? (
                      <IconTrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {dashboardStats.trends?.approvedTrend?.isPositive
                      ? "+"
                      : "-"}
                    {dashboardStats.trends?.approvedTrend?.value || 0}%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {dashboardStats.trends?.approvedTrend?.isPositive ? (
                    <>
                      Approval rate improving{" "}
                      <IconTrendingUp className="size-4" />
                    </>
                  ) : (
                    <>
                      Approval rate declining{" "}
                      <IconTrendingDown className="size-4" />
                    </>
                  )}
                </div>
                <div className="text-muted-foreground">Ready for shipping</div>
              </CardFooter>
            </Card>
            <Card className="@container/card" data-slot="card">
              <CardHeader>
                <CardDescription>Last 7 Days</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {dashboardStats.todayStats.weeklyTotal}
                </CardTitle>
                <div>
                  <Badge variant="outline">
                    {dashboardStats.trends?.weeklyTrend?.isPositive ? (
                      <IconTrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {dashboardStats.trends?.weeklyTrend?.isPositive ? "+" : "-"}
                    {dashboardStats.trends?.weeklyTrend?.value || 0}%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {dashboardStats.trends?.weeklyTrend?.isPositive ? (
                    <>
                      Trending up this week{" "}
                      <IconTrendingUp className="size-4" />
                    </>
                  ) : (
                    <>
                      Trending down this week{" "}
                      <IconTrendingDown className="size-4" />
                    </>
                  )}
                </div>
                <div className="text-muted-foreground">
                  Orders completed in the last 7 days
                </div>
              </CardFooter>
            </Card>
            <Card className="@container/card" data-slot="card">
              <CardHeader>
                <CardDescription>Last 30 Days</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {dashboardStats.todayStats.monthlyTotal}
                </CardTitle>
                <div>
                  <Badge variant="outline">
                    {dashboardStats.trends?.monthlyTrend?.isPositive ? (
                      <IconTrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {dashboardStats.trends?.monthlyTrend?.isPositive
                      ? "+"
                      : "-"}
                    {dashboardStats.trends?.monthlyTrend?.value || 0}%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {dashboardStats.trends?.monthlyTrend?.isPositive ? (
                    <>
                      Strong monthly performance{" "}
                      <IconTrendingUp className="size-4" />
                    </>
                  ) : (
                    <>
                      Monthly performance down{" "}
                      <IconTrendingDown className="size-4" />
                    </>
                  )}
                </div>
                <div className="text-muted-foreground">
                  Orders completed in the last 30 days
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Stage Progress Section */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Processing Stages
            </h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <StatsCard
                title="Stage 1"
                value={dashboardStats.stageStats.stage1}
                description="Initial processing"
                icon={Boxes}
                className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
              />
              <StatsCard
                title="Stage 2"
                value={dashboardStats.stageStats.stage2}
                description="Label application"
                icon={Boxes}
                className="bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800"
              />
              <StatsCard
                title="Stage 3"
                value={dashboardStats.stageStats.stage3}
                description="Final verification"
                icon={Boxes}
                className="bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800"
              />
              <StatsCard
                title="Denied"
                value={dashboardStats.stageStats.denied}
                description="Pharmacist denials"
                icon={XCircle}
                className="bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
              />
              <StatsCard
                title="Skipped Today"
                value={dashboardStats.todayStats.skipped}
                description="Orders skipped"
                icon={AlertCircle}
                className="bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800"
              />
              <div className="bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <HourlyDistributionDialog
                  hourlyDistribution={hourlyDistribution}
                />
              </div>
            </div>
          </div>

          {/* Full-width Processing Chart */}
          <div className="mb-8">
            <ProcessingChart initialData={hourlyStats} />
          </div>

          {/* Cage Distribution and Belt Performance */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2">
            <CageDistributionDialog data={dashboardStats.cageDistribution} />
            <BeltPerformanceCard data={dashboardStats.beltPerformance} />
          </div>

          {/* Activity and Affiliates */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <ActivityFeed activities={dashboardStats.recentActivity} />
            <TopAffiliates data={dashboardStats.topAffiliates} />
          </div>

          {/* Active Users */}
          <div>
            <StatsCard
              title="Active Users"
              value={dashboardStats.activeUsers.reduce(
                (sum: number, u: any) => sum + u.count,
                0
              )}
              description={dashboardStats.activeUsers
                .map((u: any) => `${u.role}: ${u.count}`)
                .join(", ")}
              icon={Users}
              className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-0 shadow-md"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
