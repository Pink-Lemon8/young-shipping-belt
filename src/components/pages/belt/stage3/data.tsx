"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { pushQueueCompleted } from "../action";
import { useToast } from "@/components/hooks/use-toast";
import { OrderInfo } from "./data/info";
import { FileList } from "../data/file-list";
import { base64ToBlob } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Result } from "@/lib/types";
import { ErrorDialog } from "../data/error-dialog";

// Hoisted loading component (Rule 6.2)
const WebcamLoadingSkeleton = () => (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

/** Stage 3 completion always assigns cage 1 (no cage picker UI). */
const STAGE3_AUTO_CAGE_CODE = "1";

const TakePictureAndShow = dynamic(
  () =>
    import("../data/take-picture-and-show").then((m) => m.TakePictureAndShow),
  { ssr: false, loading: WebcamLoadingSkeleton },
);

export default function BeltStage3Data({
  data = {},
  process = {},
  groupedProcess = [],
  loading = false,
  setLoading = undefined,
}: {
  data?: any;
  process?: any;
  groupedProcess?: any[];
  loading?: boolean;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [takePicture, setTakePicture] = useState(false);
  const [image, setImage] = useState<string | undefined>(undefined);

  const [errorResult, setErrorResult] = useState<Result | undefined>(undefined);

  const { toast } = useToast();
  const router = useRouter();

  const setResult = (result: any) => {
    setImage(result);
  };

  const handlePushQueue = async () => {
    setLoading?.(true);

    const imageBase64 = image?.split(",")[1];
    const blob = base64ToBlob(imageBase64 ?? "", "image/jpeg");
    const formData = new FormData();
    formData.append("file", blob, "image_stage3.jpeg");

    const res = await pushQueueCompleted(
      process?.orderId ?? "",
      groupedProcess?.map((q: any) => q.orderId),
      formData,
      STAGE3_AUTO_CAGE_CODE,
    );
    if (res?.status === "success") {
      setResult(res);
      toast({
        title: "Success",
        description: res?.messages?.join(", ") ?? "Order completed",
      });
      const url = new URL(window.location.href);
      const hasQuery = url.search.length > 0;
      if (hasQuery) {
        router.replace(url.pathname);
      }
      router.refresh();
    } else {
      setErrorResult(res);
      toast({
        title: "Error",
        variant: "destructive",
        description:
          res?.messages?.join(", ") ?? "Failed to complete order",
      });
    }
    setLoading?.(false);
  };

  useEffect(() => {
    console.log(errorResult);
  }, [errorResult]);

  return (
    <div className="container mx-auto max-w-7xl">
      {!loading && (
        <div className="grid lg:grid-cols-2 gap-6">
          <OrderInfo
            data={data}
            process={process}
            groupedProcess={groupedProcess}
            takePicture={takePicture}
            setTakePicture={setTakePicture}
            handlePushQueue={handlePushQueue}
          />
          <div className="space-y-6">
            <TakePictureAndShow
              taken={takePicture}
              setTaken={setTakePicture}
              setResult={setResult}
              readyToPicture={true}
            />
            <FileList
              files={[...(process.label ?? []), ...(process.files ?? [])]}
            />
          </div>
        </div>
      )}
      <ErrorDialog
        result={errorResult}
        setResult={setErrorResult}
      />
    </div>
  );
}
