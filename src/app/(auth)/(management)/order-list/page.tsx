import { Suspense } from "react";
import { Navbar } from "@/components/layout/management/sidebar/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import OrderListData from "@/components/pages/management/order-list/data";
import { getQueueByBeltCodeInProcessView } from "@/server/controller/queues";
import { beltQueueStatusTypes } from "@/db/schema";

type SearchParams = {
  search: string | undefined;
  page: number | undefined;
  maxOnPage: number | undefined;
  status: string | undefined;
  isCv: string | undefined;
};

type OrderListPageProps = {
  searchParams: Promise<SearchParams>;
};

function DataSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-10 w-full max-w-md" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function OrderListDataWrapper({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filter = await searchParams;
  const search = filter.search?.trim();
  const page = filter.page ? Number(filter.page) : 1;
  const maxOnPage = filter.maxOnPage ? Number(filter.maxOnPage) : 15;
  const beltCode = "C";

  const groupId = search?.toUpperCase().includes("G-")
    ? Number(search.toUpperCase().split("G-")[1]) > 0
      ? Number(search.toUpperCase().split("G-")[1])
      : undefined
    : undefined;

  const rawStatus = filter.status?.trim();
  const statusFilter =
    rawStatus && beltQueueStatusTypes.includes(rawStatus as any)
      ? [rawStatus as (typeof beltQueueStatusTypes)[number]]
      : undefined;

  const isCvFilter =
    filter.isCv === "true" ? true : filter.isCv === "false" ? false : undefined;

  const data = await getQueueByBeltCodeInProcessView(
    beltCode,
    statusFilter,
    undefined,
    {
      search: groupId ? undefined : search,
      groupId,
      isCv: isCvFilter,
    },
    false,
    maxOnPage,
    (page - 1) * maxOnPage,
  );

  return (
    <OrderListData
      queues={data?.queue}
      length={data?.length}
      totalPages={data?.totalPages}
      maxOnPage={maxOnPage}
      groupIdToOrderIds={data?.groupIdToOrderIds}
      statusValue={rawStatus}
      isCvValue={filter.isCv}
    />
  );
}

export default function OrderListPage({ searchParams }: OrderListPageProps) {
  return (
    <>
      <Navbar title="Order List" />

      <div className="p-5">
        <Suspense fallback={<DataSkeleton />}>
          <OrderListDataWrapper searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
