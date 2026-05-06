"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BeltBadge } from "./belt-badge";
import { beltStages } from "@/lib/const";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export function BeltSelect({
  userBeltCode,
  currentBeltCode,
}: {
  userBeltCode: string;
  currentBeltCode: string;
}) {
  const [loading, setLoading] = useState(false);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();

  // Layout korununca unmount olmaz; navigasyon bitince URL'den gelen kod değişince loading'i kapat
  useEffect(() => {
    setLoading(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [currentBeltCode]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="flex flex-col gap-2">
        {!loading ? (
          <Select
            defaultValue={
              currentBeltCode.length === 1
                ? currentBeltCode + "1"
                : currentBeltCode
            }
            onValueChange={(value) => {
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
              }
              setLoading(true);
              router.push(`/belt/${value}`);
              // Navigasyon takılırsa (hata, iptal vb.) spinner'da kalma
              loadingTimeoutRef.current = setTimeout(() => {
                setLoading(false);
                loadingTimeoutRef.current = null;
              }, 12_000);
            }}
          >
            <SelectTrigger className="w-28 h-10 px-4">
              <SelectValue placeholder={currentBeltCode} />
            </SelectTrigger>
            <SelectContent className="w-28" side="bottom" align="center">
              {beltStages.map((belt, index) => (
                <SelectItem key={index} value={userBeltCode + belt}>
                  <BeltBadge beltCode={userBeltCode + belt} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="w-28 h-10 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </div>
    </>
  );
}
