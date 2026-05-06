import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header skeleton */}
      <div className="text-center mb-8">
        <Skeleton className="h-10 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Top 3 podium skeleton */}
      <div className="flex justify-center items-end gap-4 mb-8">
        <div className="text-center">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-2" />
          <Skeleton className="h-4 w-24 mx-auto mb-1" />
          <Skeleton className="h-6 w-16 mx-auto" />
        </div>
        <div className="text-center -mt-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto mb-2" />
          <Skeleton className="h-4 w-28 mx-auto mb-1" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-2" />
          <Skeleton className="h-4 w-24 mx-auto mb-1" />
          <Skeleton className="h-6 w-16 mx-auto" />
        </div>
      </div>

      {/* Leaderboard list skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
