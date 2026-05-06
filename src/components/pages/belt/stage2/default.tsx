"use client";
import { BeltCheckerModal } from "../belt-checker/modal";
import { useEffect, useRef, useState } from "react";
import { Result } from "@/lib/types";
import { useRouter } from "next/navigation";
import BeltHeader from "../header";
import BeltLoading from "../loading";
import BeltError from "../error";
import BeltStage2Data from "./data";

export default function BeltStage2Default({
  children,
  currentBeltCode,
  userBeltCode,
  beltQueue,
  pushedOrdersCountToday,
}: {
  children?: React.ReactNode;
  currentBeltCode: string;
  userBeltCode: string;
  beltQueue: Result;
  pushedOrdersCountToday?: number;
}) {
  const [beltCheck, setBeltCheck] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<Result | undefined>(undefined);

  const [scanBarcodeText, setScanBarcodeText] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    setResult(beltQueue);
    setLoading(false);
  }, [beltQueue]);

  const scanBarcode = (event: KeyboardEvent) => {
    const key = event.key;
    if (key !== "Enter" && key.toUpperCase() !== "O") {
      setScanBarcodeText((prev) => prev + key);
    } else if (key === "Enter" && scanBarcodeText !== "") {
      setLoading(true);
      router.push(`/belt/${currentBeltCode}?orderId=${scanBarcodeText}`);
      setScanBarcodeText("");
    }
  };

  useEffect(() => {
    window.addEventListener("keypress", scanBarcode);
    return () => window.removeEventListener("keypress", scanBarcode);
  }, [currentBeltCode, scanBarcodeText, router, loading]);

  return (
    <section className="relative">
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
          pushedOrdersCountToday={pushedOrdersCountToday}
        />

        {loading && <BeltLoading />}

        {!loading && result?.status !== "success" && (
          <BeltError result={result} setLoading={setLoading} />
        )}

        {!loading && result?.status === "success" && (
          <BeltStage2Data
            data={result?.value?.orderDetails}
            process={result?.value?.queue?.[0]}
            groupedProcess={result?.value?.groupedQueue}
            loading={loading}
            setLoading={setLoading}
          />
        )}

        {children}
      </div>
    </section>
  );
}
