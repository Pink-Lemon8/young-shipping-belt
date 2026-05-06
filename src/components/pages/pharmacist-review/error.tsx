import { Card } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

type BeltErrorProps = {
  result: any;
  setLoading: (loading: boolean) => void;
  reFetch: (orderId?: string) => void;
};

export default function PharmacistReviewError({
  result,
  setLoading,
  reFetch,
}: BeltErrorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <div className="p-8 flex flex-col items-center">
        <div className="bg-red-100 p-3 rounded-full mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
        <div className="text-center max-w-md mb-6">
          {result?.messages?.map((message: string) => (
            <p key={message} className="text-muted-foreground mb-1">
              {message}
            </p>
          ))}
        </div>
        <div className="flex flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              router.push("/pharmacist-review");
              reFetch();
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Queue
          </Button>
          <Button
            onClick={() => {
              router.refresh();
              const orderId = searchParams.get("orderId");
              reFetch(orderId ?? undefined);
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Loading Data
          </Button>
        </div>
      </div>
    </Card>
  );
}
