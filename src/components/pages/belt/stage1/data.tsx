"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { OrderInfo } from "./data/info";
import { FileList } from "../data/file-list";
import { MonographFile } from "../data/monograph-file";
import { OrderSlipPdf } from "../data/order-slip-pdf";
import { pushQueueStage2 } from "../action";
import { useToast } from "@/components/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { base64ToBlob } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Hoisted loading component (Rule 6.2)
const WebcamLoadingSkeleton = () => (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const TakePictureAndShow = dynamic(
  () =>
    import("../data/take-picture-and-show").then((m) => m.TakePictureAndShow),
  { ssr: false, loading: WebcamLoadingSkeleton },
);

export default function BeltStage1Data({
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
  const [readyToPicture, setReadyToPicture] = useState(false);
  const [takePicture, setTakePicture] = useState(false);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [itemInfos, setItemInfos] = useState<any | undefined>(undefined);

  const { toast } = useToast();
  const router = useRouter();

  const handlePushQueue = async () => {
    setLoading?.(true);

    const imageBase64 = image?.split(",")[1];
    const blob = base64ToBlob(imageBase64 ?? "", "image/jpeg");
    const formData = new FormData();
    formData.append("file", blob, "image_stage1.jpeg");

    const res = await pushQueueStage2(
      process?.orderId ?? "",
      groupedProcess?.map((q: any) => q.orderId),
      formData,
      itemInfos,
      [
        ...(data.items ?? []),
        ...groupedProcess.flatMap((q: any) => q.orderDetails?.items ?? []),
      ],
    );
    if (res?.status === "success") {
      toast({
        title: "Success",
        description: res?.messages?.join(", ") ?? "Order pushed to queue",
      });
      const url = new URL(window.location.href);
      const hasQuery = url.search.length > 0;
      if (hasQuery) {
        router.replace(url.pathname);
      }
      router.refresh();
      setLoading?.(false);
    } else {
      toast({
        title: "Error",
        variant: "destructive",
        description:
          res?.messages?.join(", ") ?? "Failed to push order to queue",
      });
      setLoading?.(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl">
      {loading ? (
        <div className="flex justify-center items-center mt-5">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <OrderInfo
            data={data}
            process={process}
            groupedProcess={groupedProcess}
            takePicture={takePicture}
            setTakePicture={setTakePicture}
            handlePushQueue={handlePushQueue}
            itemInfos={itemInfos}
            setItemInfos={setItemInfos}
            readyToPicture={readyToPicture}
            setReadyToPicture={setReadyToPicture}
          />
          <div className="space-y-6">
            <TakePictureAndShow
              images={process.images}
              taken={takePicture}
              setTaken={setTakePicture}
              setResult={setImage}
              readyToPicture={readyToPicture}
              setReadyToPicture={setReadyToPicture}
            />
            <FileList
              listTitle={
                groupedProcess.length > 0
                  ? `Order #${process?.orderId ?? ""} Files`
                  : "Order Files"
              }
              files={[
                ...(process.label ?? []),
                ...(process.files ?? []),
                ...(process.extraFiles ?? []),
              ]}
            />
            {groupedProcess.length > 0 && (
              <FileList
                listTitle={`Grouped Orders ${groupedProcess.map((q: any) => "#" + q.orderId).join(", ")} Files`}
                files={[
                  ...(groupedProcess?.map((q: any) => q.extraFiles).flat() ??
                    []),
                ]}
              />
            )}
            <MonographFile
              items={[
                ...data.items,
                ...groupedProcess.flatMap((q: any) => q.orderDetails.items),
              ]}
              pwMonographUrl={data.monographUrl}
            />
            <OrderSlipPdf
              orderId={process?.orderId ?? ""}
              patientName={data?.patientName ?? ""}
              shippingAddress={data?.shippingAddress}
              trackingNumber={process?.trackingNumber}
            />
          </div>
        </div>
      )}
    </div>
  );
}
