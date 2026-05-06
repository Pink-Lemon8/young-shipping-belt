import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Result } from "@/lib/types";
import { onlyNumbers } from "@/lib/utils";

type ManualFormProps = {
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function ManualForm({
  setResult,
  open,
  setOpen,
}: ManualFormProps) {
  const [manualQueue, setManualQueue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const searchParams = useSearchParams();

  const getManualQueue = async () => {
    setLoading?.(true);
    router.push(`pharmacist-review?orderId=${manualQueue?.trim()}`);
  };

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) {
      setManualQueue(orderId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (loading) {
      setLoading?.(false);
      setOpen?.(false);
      setResult?.({
        status: "success",
        value: {
          orderId: manualQueue?.trim(),
        },
      });
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
          setManualQueue(onlyNumbers(e.target.value));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            getManualQueue();
          }
        }}
        className="w-32 pr-6"
      />
      <Button onClick={getManualQueue} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowLeft className="h-4 w-4" />
        )}
      </Button>
    </span>
  );
}
