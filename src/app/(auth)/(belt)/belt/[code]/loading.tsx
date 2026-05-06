import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Order info card skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items list skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
