import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Result } from "@/lib/types";
import { cn } from "@/lib/utils";

type ManualFormProps = {
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
  pageLoading?: boolean;
  setPageLoading?: Dispatch<SetStateAction<boolean>>;
};

export default function ManualForm({
  pageLoading,
  setPageLoading,
  setResult,
  open,
  setOpen,
}: ManualFormProps) {
  const searchParams = useSearchParams();

  const [manualQueue, setManualQueue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const getManualQueue = async () => {
    if (loading) return;
    if (manualQueue?.trim().length === 0) return;
    const getsearchParams = new URLSearchParams(searchParams);
    const orderId = getsearchParams.get("orderId");
    if (orderId === manualQueue?.trim()) return;
    setLoading?.(true);
    setPageLoading?.(true);
    router.push(`?orderId=${manualQueue?.trim()}`);
  };

  useEffect(() => {
    if (loading) {
      setLoading?.(false);
      setOpen?.(false);
      setPageLoading?.(true);
      setResult?.({
        status: "success",
        value: {
          orderId: manualQueue?.trim(),
        },
      });
    }
    if (searchParams.get("orderId") !== manualQueue?.trim()) {
      setManualQueue(searchParams.get("orderId") ?? "");
    }
  }, [searchParams]);

  return (
    <span className="relative font-semibold flex flex-row gap-2 cursor-pointer">
      <Input
        type="text"
        disabled={loading}
        placeholder="Order ID"
        value={manualQueue}
        onChange={(e) => {
          setManualQueue(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            getManualQueue();
          }
        }}
        className={cn("w-32 pr-6", loading && "animate-pulse")}
      />
      <Button
        onClick={getManualQueue}
        disabled={loading}
        className={cn(loading && "animate-pulse")}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowLeft className="h-4 w-4" />
        )}
      </Button>
    </span>
  );
}
