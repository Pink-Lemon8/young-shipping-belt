import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  InfoIcon,
  RefreshCw,
  ShieldAlert,
  ShieldQuestionIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type BeltErrorProps = {
  result: any;
  setLoading: (loading: boolean) => void;
};

export default function BeltError({ result, setLoading }: BeltErrorProps) {
  const router = useRouter();
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <div className="p-8 flex flex-col items-center">
        <div
          className={`${result?.status === "warning" ? "bg-yellow-100" : result?.status === "info" ? "bg-blue-100" : "bg-red-100"} p-3 rounded-full mb-4`}
        >
          {result?.status === "warning" && (
            <ShieldAlert className="h-6 w-6 text-yellow-600" />
          )}
          {result?.status === "info" && (
            <InfoIcon className="h-6 w-6 text-blue-600" />
          )}
          {result?.status === "error" && (
            <AlertTriangle className="h-6 w-6 text-red-600" />
          )}
        </div>
        <h3 className="text-lg font-medium mb-2">
          {result?.status === "warning"
            ? "Warning Message"
            : result?.status === "info"
              ? "Info Message"
              : "Error Loading Data"}
        </h3>
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
              router.back();
              setLoading(true);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={() => {
              router.refresh();
              setLoading(true);
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
