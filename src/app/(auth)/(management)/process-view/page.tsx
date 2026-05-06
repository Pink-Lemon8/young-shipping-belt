import { Suspense } from "react";
import ProcessViewData from "@/components/pages/management/process-view/data";
import { beltQueueStatusTypes, pharmacistReviewStatusTypes } from "@/db/schema";
import BCrumb from "./breadcrumb";
import { getQueueByBeltCodeInProcessView } from "@/server/controller/queues";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Navbar } from "@/components/layout/management/sidebar/navbar";

function DataSkeleton() {
  return (
    <>
      <Card className="mb-3 border-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4 items-center">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

type SearchParams = {
  search: string | undefined;
  beltCode: string | undefined;
  status: string | undefined;
  pharmacistReviewStatus: string | undefined;
  page: number | undefined;
  maxOnPage: number | undefined;
  isSkipped: string | undefined;
  isLocked: string | undefined;
  reviewCountLessThan: string | undefined;
  reviewCountLessThanValue: number | undefined;
  shipDateFrom: string | undefined;
  shipDateTo: string | undefined;
};

type ProcessViewPageProps = {
  searchParams: Promise<SearchParams>;
};

async function ProcessViewDataWrapper({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filter = await searchParams;

  const search = filter.search;
  const beltCode = "C";//filter.beltCode || "B";
  const status = filter.status;
  const pharmacistReviewStatus = filter.pharmacistReviewStatus;
  const page = filter.page ? Number(filter.page) : 1;
  const maxOnPage = filter.maxOnPage ? Number(filter.maxOnPage) : 15;
  const isSkipped = filter.isSkipped === "true" ? true : false;
  const isLocked = filter.isLocked === "true" ? true : false;
  const reviewCountLessThan = filter.reviewCountLessThan === "true";
  const reviewCountLessThanValue = filter.reviewCountLessThanValue !== undefined && reviewCountLessThan ? Number(filter.reviewCountLessThanValue) : undefined;
  const shipDateFrom = filter.shipDateFrom;
  const shipDateTo = filter.shipDateTo;

  const groupId = search?.toUpperCase()?.includes("G-")
    ? Number(search.toUpperCase().split("G-")[1]) > 0
      ? Number(search.toUpperCase().split("G-")[1])
      : undefined
    : undefined;

  const data = await getQueueByBeltCodeInProcessView(
    beltCode,
    status ? [status as (typeof beltQueueStatusTypes)[number]] : undefined,
    pharmacistReviewStatus
      ? [pharmacistReviewStatus as (typeof pharmacistReviewStatusTypes)[number]]
      : undefined,
    {
      search: groupId ? undefined : search ? search.trim() : undefined,
      isSkipped: isSkipped ? isSkipped : undefined,
      isLocked: isLocked ? isLocked : undefined,
      reviewCountLessThan: reviewCountLessThan ? reviewCountLessThanValue : undefined,
      groupId: groupId ? groupId : undefined,
      shipDateFrom: shipDateFrom || undefined,
      shipDateTo: shipDateTo || undefined,
    },
    true,
    maxOnPage,
    (page - 1) * maxOnPage,
  );

  return (
    <ProcessViewData
      queues={data?.queue}
      length={data?.length}
      totalPages={data?.totalPages}
      maxOnPage={maxOnPage}
    />
  );
}

export default function ProcessViewPage({
  searchParams,
}: ProcessViewPageProps) {
  return (
    <>
      <Navbar title="Process View" />

      <div className="p-5">
        <Suspense fallback={<DataSkeleton />}>
          <ProcessViewDataWrapper searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
