"use client";
import { formatDate } from "@/lib/utils";
import {
  Package,
  Truck,
  User,
  Building,
  Calendar,
  Tag,
  BookOpenText,
  BookImage,
  Loader2,
  User2Icon,
  Plus,
  Pill,
  Copy,
  Check,
} from "lucide-react";
import { getOrderItemsByOrderId } from "./action";
import { Status } from "../status";
import { PharmacistReviewStatus } from "../pharmacist-review-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeltBadge } from "@/components/pages/belt/belt-badge";
import { FileList } from "@/components/pages/belt/data/file-list";
import { LogActionBadge } from "@/components/common/log-action-badge";
import { useEffect, useMemo } from "react";
import { useState } from "react";
import { getFiles } from "@/components/common/file/get";
import Image from "next/image";
import { FileModel } from "@/components/common/file/model";
import { ShippingMethod } from "./shipping-method";
import { AffiliateShippingPreference } from "./affiliate-shipping-preference";
import { ModelImageView } from "@/components/pages/pharmacist-review/data/show-picture/model-image-view";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BoxTypeBadge } from "@/components/common/box-type-badge";
import { UploadExtraFileDialog } from "../upload-extra-file/dialog";
import { Button } from "@/components/ui/button";
export default function ProcessViewInfoData({
  queue,
  groupedQueues = undefined,
}: {
  queue: any;
  groupedQueues?: any[];
}) {
  const [publicImages, setPublicImages] = useState<
    { key: string; url: string }[] | undefined
  >(undefined);
  const [publicImageError, setPublicImageError] = useState<string | undefined>(
    undefined,
  );
  const [loadingPublicImages, setLoadingPublicImages] = useState(true);
  const [selectedPublicImage, setSelectedPublicImage] = useState<
    any | undefined
  >(undefined);
  const [selectedPublicImageOpen, setSelectedPublicImageOpen] = useState(false);
  const [selectedPublicImageRotation, setSelectedPublicImageRotation] =
    useState(0);

  const [uploadExtraFileOpen, setUploadExtraFileOpen] = useState(false);

  const sortedPublicImages = useMemo(() => {
    if (!publicImages) return [];
    return [...publicImages].sort((a, b) => {
      const getStageId = (key: string) => {
        const match = key.match(/stage(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getStageId(a.key) > getStageId(b.key) ? 1 : -1;
    });
  }, [publicImages]);

  useEffect(() => {
    if (
      !selectedPublicImageOpen ||
      !selectedPublicImage ||
      sortedPublicImages.length === 0
    )
      return;
    const currentIndex = sortedPublicImages.findIndex(
      (img) => img.key === selectedPublicImage.key,
    );
    if (currentIndex === -1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex =
          currentIndex <= 0 ? sortedPublicImages.length - 1 : currentIndex - 1;
        setSelectedPublicImage(sortedPublicImages[prevIndex]);
        setSelectedPublicImageRotation(0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex =
          currentIndex >= sortedPublicImages.length - 1 ? 0 : currentIndex + 1;
        setSelectedPublicImage(sortedPublicImages[nextIndex]);
        setSelectedPublicImageRotation(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPublicImageOpen, selectedPublicImage, sortedPublicImages]);

  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(true);
  const [copiedLot, setCopiedLot] = useState<string | null>(null);

  const copyLotNumber = (lotNumber: string) => {
    navigator.clipboard.writeText(lotNumber);
    setCopiedLot(lotNumber);
    setTimeout(() => setCopiedLot(null), 2000);
  };

  const fetchOrderItems = async () => {
    if (!queue?.orderId) return;
    const result = await getOrderItemsByOrderId(queue.orderId);
    if (result?.status === "success") {
      setOrderItems(result.data);
    }
    setLoadingOrderItems(false);
  };

  const fetchPublicImages = async () => {
    const result = await getFiles(queue.images.map((image: any) => image.key));
    if (result?.status === "success") {
      setPublicImages(result.value);
      setPublicImageError(undefined);
    } else if (result?.status === "error") {
      setPublicImageError(
        result.messages?.[0] || "Failed to fetch public images",
      );
    }
    setLoadingPublicImages(false);
  };

  useEffect(() => {
    if (queue.images) fetchPublicImages();
  }, [queue.images]);

  useEffect(() => {
    const stage1Done = ["STAGE2", "STAGE3", "COMPLETED"].includes(
      queue?.status,
    );
    if (stage1Done) fetchOrderItems();
    else setLoadingOrderItems(false);
  }, [queue?.orderId, queue?.status]);

  if (!queue) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No order information available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Info */}
      <UploadExtraFileDialog
        orderId={queue.orderId}
        open={uploadExtraFileOpen}
        setOpen={setUploadExtraFileOpen}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 space-y-4 md:space-y-0 gap-0 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Package className="h-4 w-4 mr-2 text-primary" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {queue.groupId && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Group ID</dt>
                  <dd className="font-medium">G-{queue.groupId}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Order ID</dt>
                <dd className="font-medium">
                  {queue.orderId}
                  {groupedQueues && groupedQueues?.length > 0 && (
                    <span>
                      ,{" "}
                      {groupedQueues
                        ?.map((group: any) => group.orderId)
                        .join(", ")}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Patient ID</dt>
                <dd className="font-medium">{queue.patientId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Batch ID</dt>
                <dd className="font-medium">{queue.batchId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Belt Code</dt>
                <dd className="font-medium">
                  <BeltBadge beltCode={queue.beltCode} />
                </dd>
              </div>
              {queue.cageCode && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cage Code</dt>
                  <dd className="font-medium">{queue.cageCode}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Shipping Information
              <ShippingMethod shipping={queue.shippingMethod} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tracking Number</dt>
                <dd className="font-medium">{queue.trackingNumber || "N/A"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="font-medium">{queue.transactionId || "N/A"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Label Created</dt>
                <dd className="font-medium">
                  {queue.labelCreatedAt
                    ? formatDate(queue.labelCreatedAt)
                    : "N/A"}
                </dd>
              </div>
              {queue.BoxSize && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Box Size</dt>
                  <dd className="font-medium flex items-center gap-2">
                    {queue.BoxSize.name}{" "}
                    <BoxTypeBadge type={queue.BoxSize.type} />
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center">
            <Tag className="h-4 w-4 mr-2 text-primary" />
            Status Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Processing Status
              </h4>
              <div className="flex items-center">
                <Status status={queue.status} />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Pharmacist Review
              </h4>
              <div className="flex items-center flex-wrap gap-2">
                {queue.PharmacistReview !== null &&
                  queue.PharmacistReview?.length > 0 ? (
                  queue.PharmacistReview.map((review: any, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-2 space-2"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-pointer w-fit">
                              <PharmacistReviewStatus status={review.status} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="text-center">
                            <p>
                              {review.status} by{" "}
                              <span className="font-bold">
                                {review.ReviewBy.name}
                              </span>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <PharmacistReviewStatus status="PENDING" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Last Updated
              </h4>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{formatDate(queue.updatedAt) || "N/A"}</span>
              </div>
            </div>
            {queue.LockedForBeltUser && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Locked For User
                </h4>
                <div className="flex items-center">
                  <User2Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{queue.LockedForBeltUser.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {queue.LockedForBeltUser.email}
                  </span>
                </div>
              </div>
            )}

            {queue.SkippedBy && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Skipped By
                </h4>
                <div className="flex items-center">
                  <User2Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{queue.SkippedBy.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {queue.SkippedBy.email}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-600">Reason:</span>
                  <span className="text-muted-foreground ml-2">
                    {queue.comments?.join(", ")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Affiliate Information */}
      {queue.Affiliate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Building className="h-4 w-4 mr-2 text-primary" />
              Affiliate Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold">
                  {queue.Affiliate.name}
                </h3>
                <Badge variant="outline" className="ml-2">
                  {queue.Affiliate.code}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <h4 className="font-medium text-muted-foreground">
                    Category
                  </h4>
                  <p>{queue.Affiliate.category}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-muted-foreground">
                    Shipping Preference
                  </h4>
                  <AffiliateShippingPreference
                    shipping={queue.Affiliate.shippingPreference}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Pharmacist Review Information */}
      {queue.PharmacistReviewBy && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-primary" />
              Pharmacist Review Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <h4 className="font-medium text-muted-foreground">
                  Reviewed By
                </h4>
                <p>{queue.PharmacistReviewBy.name}</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-muted-foreground">Email</h4>
                <p>{queue.PharmacistReviewBy.email}</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-muted-foreground">
                  Review Date
                </h4>
                <p>{formatDate(queue.pharmacistReviewAt) || "N/A"}</p>
              </div>
              {queue.comments && queue.comments.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-medium text-">Denied Reason</h4>
                  {queue.comments.map((comment: any, index: number) => (
                    <p key={index}>{comment}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Additional tabs for more data */}
      <Tabs defaultValue="timestamps" className="w-full mb-2">
        <TabsList className="h-auto w-full flex flex-wrap gap-1 p-1 md:h-10 md:flex-nowrap md:gap-0">
          <TabsTrigger value="timestamps" className="flex-1 basis-[calc(50%-0.25rem)] md:basis-auto text-xs md:text-sm px-2 md:px-3 py-1.5">
            Timestamps
          </TabsTrigger>
          {["STAGE2", "STAGE3", "COMPLETED"].includes(queue.status) && (
            <TabsTrigger value="items" className="flex-1 basis-[calc(50%-0.25rem)] md:basis-auto text-xs md:text-sm px-2 md:px-3 py-1.5">
              Items & Lots
            </TabsTrigger>
          )}
          {(queue.files && queue.files.length > 0) ||
            (queue.label && queue.label.length > 0) ? (
            <TabsTrigger value="files" className="flex-1 basis-[calc(50%-0.25rem)] md:basis-auto text-xs md:text-sm px-2 md:px-3 py-1.5">
              Files
            </TabsTrigger>
          ) : undefined}
          {queue.images && queue.images.length > 0 && (
            <TabsTrigger value="images" className="flex-1 basis-[calc(50%-0.25rem)] md:basis-auto text-xs md:text-sm px-2 md:px-3 py-1.5">
              Images
            </TabsTrigger>
          )}
          {queue.Logs && queue.Logs.length > 0 && (
            <TabsTrigger value="logs" className="flex-1 basis-[calc(50%-0.25rem)] md:basis-auto text-xs md:text-sm px-2 md:px-3 py-1.5">
              Advanced Logs
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="timestamps">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {queue.extraFilesCreatedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Rx & Invoice Uploaded At
                    </dt>
                    <dd className="font-medium">
                      {formatDate(queue.extraFilesCreatedAt) || "N/A"}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Label Created At</dt>
                  <dd className="font-medium">
                    {queue.labelCreatedAt
                      ? formatDate(queue.labelCreatedAt)
                      : "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sent To Belt At</dt>
                  <dd className="font-medium">
                    {queue.createdAt ? formatDate(queue.createdAt) : "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipped At</dt>
                  <dd className="font-medium">
                    {queue.shippedAt ? formatDate(queue.shippedAt) : "N/A"}
                  </dd>
                </div>
                {queue.lockedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Locked At</dt>
                    <dd className="font-medium">
                      {formatDate(queue.lockedAt) || "N/A"}
                    </dd>
                  </div>
                )}
                {queue.pharmacistReviewAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Pharmacist Review At
                    </dt>
                    <dd className="font-medium">
                      {formatDate(queue.pharmacistReviewAt) || "N/A"}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Updated At</dt>
                  <dd className="font-medium">
                    {formatDate(queue.updatedAt) || "N/A"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {["STAGE2", "STAGE3", "COMPLETED"].includes(queue.status) && (
          <TabsContent value="items">
            <Card>
              <CardContent className="pt-6">
                {loadingOrderItems ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : orderItems.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Pill className="h-4 w-4 text-primary mr-2" />
                      Order Items ({orderItems.length})
                    </h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">
                              Package ID
                            </th>
                            <th className="text-left p-3 font-medium">
                              Description
                            </th>
                            <th className="text-left p-3 font-medium">DIN</th>
                            <th className="text-left p-3 font-medium">
                              Lot Number
                            </th>
                            <th className="text-right p-3 font-medium">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderItems.map((item: any, index: number) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 font-mono">
                                {item.packageId}
                              </td>
                              <td className="p-3">
                                {item.description || "N/A"}
                              </td>
                              <td className="p-3">{item.din || "N/A"}</td>
                              <td className="p-3">
                                {item.lotNumber ? (
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono">
                                      {item.lotNumber}
                                    </span>
                                    <button
                                      onClick={() =>
                                        copyLotNumber(item.lotNumber)
                                      }
                                      className="p-1 hover:bg-muted rounded"
                                    >
                                      {copiedLot === item.lotNumber ? (
                                        <Check className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {item.quantity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No items recorded for this order
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {(queue.files && queue.files.length > 0) ||
          (queue.label && queue.label.length > 0) ? (
          <TabsContent value="files">
            <div className="flex justify-end">
              <Button
                onClick={() => setUploadExtraFileOpen(true)}
                variant="outline"
                className="mb-4"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <FileList
              files={[
                ...(queue.label || []),
                ...(queue.files || []),
                ...(queue.extraFiles || []),
                ...(groupedQueues?.flatMap((group: any) => group.extraFiles) ??
                  []),
              ]}
              orderId={queue.orderId}
            />
          </TabsContent>
        ) : undefined}

        {queue.images && queue.images.length > 0 && (
          <TabsContent value="images">
            <Card>
              <ModelImageView
                imageSrc={selectedPublicImage?.url}
                width={1920}
                height={1080}
                rotation={selectedPublicImageRotation}
                setRotation={setSelectedPublicImageRotation}
                open={selectedPublicImageOpen}
                setOpen={setSelectedPublicImageOpen}
              />

              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                    <BookImage className="h-4 w-4 text-primary mr-2" />
                    Order Images ({queue.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sortedPublicImages.map((image: any, index: number) => (
                      <div
                        key={index}
                        className="aspect-square relative group border-2 border-transparent hover:border-primary transition-all duration-300 rounded-md overflow-hidden hover:shadow-sm group"
                      >
                        <img
                          src={image.url}
                          width={400}
                          height={400}
                          alt="Order Image"
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 group-hover:brightness-90"
                          style={{ display: "block" }}
                          onClick={() => {
                            setSelectedPublicImage(image);
                            setSelectedPublicImageOpen(true);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPublicImage(image);
                            setSelectedPublicImageOpen(true);
                          }}
                          className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          tabIndex={-1}
                          aria-label="View full image"
                        >
                          <span className="text-white font-semibold text-xs bg-black/50 rounded px-2 py-1 pointer-events-none">
                            Click to View
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                  {publicImageError && !loadingPublicImages ? (
                    <div className="text-red-500 text-center">
                      {publicImageError}
                    </div>
                  ) : undefined}
                  {loadingPublicImages && (
                    <div className="text-muted-foreground w-full flex justify-center items-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {queue.Logs && queue.Logs.length > 0 && (
          <TabsContent value="logs">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                    <BookOpenText className="h-4 w-4 text-primary mr-2" />
                    Advanced Logs ({queue.Logs.length})
                  </h3>
                </div>
                <div className="space-y-3 mt-4">
                  {queue.Logs.sort(
                    (a: any, b: any) => b.createdAt - a.createdAt,
                  ).map((log: any, index: number) => (
                    <div
                      key={index}
                      className="text-sm p-2 rounded-md border items-center"
                    >
                      <div className="flex justify-between border-b border-gray-200/50 py-1 mb-2">
                        <div className="flex items-center gap-1">
                          <span className="font-medium truncate">
                            {log.User?.name || "System"}
                          </span>
                          <span className="font-medium truncate">
                            <LogActionBadge action={log.action} />
                          </span>
                        </div>

                        <span className="font-medium truncate">
                          {formatDate(log.createdAt) || "N/A"}
                        </span>
                      </div>

                      <p className="font-medium truncate">{log.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
