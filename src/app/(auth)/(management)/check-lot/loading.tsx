import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Search input skeleton */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Results skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
