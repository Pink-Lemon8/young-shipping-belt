import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import BCrumb from "./breadcrumb";

export default function Loading() {
  return (
    <div className="container mx-auto py-5">
      <div className="flex items-center justify-between mb-3 px-3">
        <h1 className="text-2xl font-bold tracking-tight">Process View</h1>
      </div>
      <BCrumb />
      <div className="mt-3">
        <div className="mb-3">
          <Card className="border-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4 items-center">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex items-center space-x-4 col-span-2 md:mt-6">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="sr-only">Process Queue</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-sm flex flex-row items-center gap-2 text-muted-foreground whitespace-nowrap">
                  Showing <Skeleton className="w-8 h-5 inline-block" /> results
                </span>
                <Button variant="outline" className="ml-2" disabled>
                  <BellRing className="h-4 w-4" />
                  SMS Notification
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="hidden md:block">
              <div className="grid grid-cols-7 gap-4 py-2 px-4 bg-muted/30 rounded-t-lg font-medium text-sm text-muted-foreground">
                <div>Order ID</div>
                <div>Patient ID</div>
                <div>Tracking Number</div>
                <div>Status</div>
                <div>Pharmacist Review</div>
                <div>Label Created</div>
                <div></div>
              </div>

              <div className="divide-y divide-border/50 rounded-b-lg border border-border/50">
                {Array.from({ length: 15 }).map((_, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-7 gap-4 py-3 px-4 items-center ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                  >
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
