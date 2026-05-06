"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Navbar } from "@/components/layout/management/sidebar/navbar";
import { Loader2 } from "lucide-react";
import { getOrderSlipData } from "./action";
import { generateOrderSlipPdf } from "./generate-pdf";

export default function OrderSlipPage() {
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!orderId) {
      setError("Order ID is required");
      return;
    }

    setLoading(true);

    try {
      const result = await getOrderSlipData(orderId);

      if (result.status === "error") {
        setError(result.messages?.[0] || "Failed to get order data");
        setLoading(false);
        return;
      }

      const { patientName, shippingAddress, trackingNumber } = result.value;

      await generateOrderSlipPdf(
        orderId,
        patientName,
        shippingAddress,
        trackingNumber
      );
    } catch (err) {
      setError("Failed to generate order slip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar title="Get Order Slip" />
      <div className="container mx-auto my-10">
        <div className="flex flex-col items-center justify-center mt-10">
          <form
            onSubmit={handleSubmit}
            className="flex flex-row flex-wrap items-center justify-center gap-4"
          >
            <div className="flex flex-col items-center justify-center">
              <Input
                type="text"
                placeholder="Enter Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={loading}
              />
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Get Order Slip"
              )}
            </Button>
          </form>
          <p className="text-muted-foreground text-sm mt-4">
            Enter an order ID to generate and open the order slip PDF
          </p>
        </div>
      </div>
    </>
  );
}
