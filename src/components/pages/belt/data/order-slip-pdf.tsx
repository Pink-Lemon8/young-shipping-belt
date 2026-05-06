"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, EyeIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildOrderSlipPdfBytes } from "@/lib/build-order-slip-pdf";

type OrderSlipPdfProps = {
  orderId: string;
  patientName: string;
  shippingAddress: any;
  trackingNumber?: string | null;
};

export function OrderSlipPdf({
  orderId,
  patientName,
  shippingAddress,
  trackingNumber,
}: OrderSlipPdfProps) {
  const [generating, setGenerating] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const generatePdf = async () => {
    setGenerating(true);

    try {
      const pdfBytes = await buildOrderSlipPdfBytes(
        orderId,
        patientName,
        shippingAddress,
        trackingNumber
      );
      const blob = new Blob([pdfBytes as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `order-slip-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setGenerating(false);
    }
  };

  const viewPdf = async () => {
    setGenerating(true);

    try {
      const pdfBytes = await buildOrderSlipPdfBytes(
        orderId,
        patientName,
        shippingAddress,
        trackingNumber
      );
      const blob = new Blob([pdfBytes as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setViewOpen(true);
    } catch (error) {
      console.error("Error generating PDF for view:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setViewOpen(open);
    if (!open && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  if (!orderId) return null;

  return (
    <>
      <Dialog open={viewOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[75vw]">
          <DialogHeader>
            <DialogTitle>Order Slip - {orderId}</DialogTitle>
          </DialogHeader>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[60vh] rounded-md shadow-sm"
            />
          ) : (
            <div className="w-full h-[60vh] flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Order Slip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2 border rounded-md p-3">
            <div className="flex items-center space-x-3">
              <img src="/icons/pdf.svg" alt="PDF" className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Order Slip</span>
                <span className="text-xs text-muted-foreground">
                  Patient info & barcode for Stage 3
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={viewPdf}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <EyeIcon className="h-4 w-4 mr-1" />
                )}
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generatePdf}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
