"use client";
import { BeltCheckerModal } from "../belt-checker/modal";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  Loader2,
  LayoutDashboard,
  Package,
  RefreshCw,
  User,
} from "lucide-react";
import { BeltBadge } from "../belt-badge";
import { Result } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BeltSelect } from "../belt-select";
import BeltHeader from "./header";
import BeltLoading from "../loading";
import BeltError from "../error";
import BeltStage1Data from "./data";

export default function BeltStage1Default({
  children,
  currentBeltCode,
  userBeltCode,
  beltQueue,
  PushToStage2Today,
}: {
  children?: React.ReactNode;
  currentBeltCode: string;
  userBeltCode: string;
  beltQueue: Result;
  PushToStage2Today?: number;
}) {
  const [beltCheck, setBeltCheck] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<Result | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    setResult(beltQueue);
    setLoading(false);
  }, [beltQueue]);

  return (
    <section className="min-h-screen bg-background">
      <BeltCheckerModal
        open={beltCheck}
        setOpen={setBeltCheck}
        currentBeltCode={currentBeltCode}
        userBeltCode={userBeltCode}
      />

      <div className="mx-auto p-4 max-w-7xl">
        <BeltHeader
          loading={loading}
          setLoading={setLoading}
          currentBeltCode={currentBeltCode}
          userBeltCode={userBeltCode}
          result={result}
          PushToStage2Today={PushToStage2Today}
        />

        {loading && <BeltLoading />}

        {!loading && result?.status === "success" && (
          <BeltStage1Data
            data={result?.value?.orderDetails}
            process={result?.value?.queue?.[0]}
            groupedProcess={result?.value?.groupedQueue}
            loading={loading}
            setLoading={setLoading}
          />
        )}

        {!loading && result?.status !== "success" && (
          <BeltError result={result} setLoading={setLoading} />
        )}
        {children}
      </div>
    </section>
  );
}
