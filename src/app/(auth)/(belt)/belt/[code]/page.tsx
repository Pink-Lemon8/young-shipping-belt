import { Suspense } from "react";
import {
  getUserPushOrdersCountToday,
  getUserById,
} from "@/server/controller/users";
import BeltStage1Default from "@/components/pages/belt/stage1/default";
import BeltStage2Default from "@/components/pages/belt/stage2/default";
import { pullQueue } from "@/components/pages/belt/action";
import { setAllUnlockedBeltUserInQueue } from "@/server/controller/queues";
import { Result } from "@/lib/types";
import BeltStage3Default from "@/components/pages/belt/stage3/default";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Loading from "./loading";

export function generateStaticParams() {
  return [{ code: "B" }, { code: "B1" }, { code: "B2" }, { code: "B3" }];
}

type Params = Promise<{ code: string }>;
type SearchParams = Promise<{
  stage: string;
  orderId: string;
  trackingNumber: string;
}>;

async function BeltContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const code = (await params).code;
  const stage = (await searchParams).stage ?? "1";
  const orderId = (await searchParams).orderId ?? undefined;
  const trackingNumber = (await searchParams).trackingNumber ?? undefined;

  const checkBeltStage = (code.length > 1 ? code.charAt(1) : stage) as
    | "1"
    | "2"
    | "3";

  const authentication = await auth.api.getSession({
    headers: await headers(),
  });

  if (!authentication?.user) return redirect("/sign-in");

  const orderIds = orderId?.trim().split(",");
  const trackingNumbers = trackingNumber?.trim().split(",");

  // Run all independent operations in parallel (eliminates waterfall)
  const [, pushOrdersCountToday, beltUser] = await Promise.all([
    setAllUnlockedBeltUserInQueue(authentication.user.id),
    getUserPushOrdersCountToday(authentication.user.id, checkBeltStage),
    getUserById(authentication.user.id),
  ]);

  // Prepare auth user info to pass to pullQueue (avoids duplicate fetches)
  const authUser = {
    id: authentication.user.id,
    name: authentication.user.name ?? undefined,
    role: beltUser?.role ?? "regular",
  };

  let beltQueue: Result = {
    status: "info",
    messages: ["Manuel pull order or Please scan the order id."],
  };

  switch (checkBeltStage) {
    case "1":
      beltQueue = await pullQueue(
        code,
        checkBeltStage,
        authentication.user.beltCode ?? "",
        orderIds,
        undefined,
        authUser,
      );
      break;
    case "2":
      if (
        (orderIds !== undefined && orderIds?.length !== 0) ||
        (trackingNumbers !== undefined && trackingNumbers?.length !== 0)
      ) {
        beltQueue = await pullQueue(
          code,
          checkBeltStage,
          authentication.user.beltCode ?? "",
          orderIds,
          trackingNumbers,
          authUser,
        );
      }
      break;
    case "3":
      if (
        (orderIds !== undefined && orderIds?.length !== 0) ||
        (trackingNumbers !== undefined && trackingNumbers?.length !== 0)
      ) {
        beltQueue = await pullQueue(
          code,
          checkBeltStage,
          authentication.user.beltCode ?? "",
          orderIds,
          trackingNumbers,
          authUser,
        );
      }
      break;
  }
  return (
    <>
      {checkBeltStage === "1" && (
        <BeltStage1Default
          currentBeltCode={code}
          userBeltCode={authentication.user.beltCode ?? ""}
          beltQueue={beltQueue}
          PushToStage2Today={pushOrdersCountToday}
        >
          <></>
        </BeltStage1Default>
      )}
      {checkBeltStage === "2" && (
        <BeltStage2Default
          currentBeltCode={code}
          userBeltCode={authentication.user.beltCode ?? ""}
          beltQueue={beltQueue}
          pushedOrdersCountToday={pushOrdersCountToday}
        >
          <></>
        </BeltStage2Default>
      )}
      {checkBeltStage === "3" && (
        <BeltStage3Default
          currentBeltCode={code}
          userBeltCode={authentication.user.beltCode ?? ""}
          beltQueue={beltQueue}
          pushedOrdersCountToday={pushOrdersCountToday}
        >
          <></>
        </BeltStage3Default>
      )}
    </>
  );
}

export default function BeltPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <BeltContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
