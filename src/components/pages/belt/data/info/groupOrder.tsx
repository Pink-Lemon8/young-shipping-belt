"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, User, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OrderInfoProps = {
  groupedProcess: any[];
};

export function InfoGroupOrder({ groupedProcess }: OrderInfoProps) {
  return (
    <>
      <Card className="border border-muted/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-primary">
              Grouped with {groupedProcess.length} Order
              {groupedProcess.length > 1 ? "s" : ""}
            </h3>
          </div>
          {groupedProcess.map((data: any, index: number) => (
            <div
              className={cn(
                "flex flex-wrap gap-6 mt-3",
                groupedProcess.length !== index + 1
                  ? "border-b border-primary/20 pb-3 mb-3"
                  : "",
              )}
              key={data.orderId + index}
            >
              <div className="bg-muted/50 p-3 rounded-lg flex-1">
                <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base">{data.orderId}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 w-8 p-0"
                  >
                    <Link
                      href={
                        data.affiliateId === -1
                          ? `https://lymlight.com/orders/${data.orderId}`
                          : `https://cvp.pharmacywire.com/momex/NavCode/admin.cart.${data.status}.view/CartID/${data.orderId}`
                      }
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View in system</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Patient Section */}
              <div className="bg-muted/50 p-3 rounded-lg flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Patient</p>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full inline-block mb-1">
                      {data.patientId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <Link
                        href={
                          data.affiliateId === -1
                            ? `https://lymlight.com/patients/${data.patientId}`
                            : `https://cvp.pharmacywire.com/momex/NavCode/admin.customers.view/UserID/${data.patientId}`
                        }
                        target="_blank"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View patient in system</span>
                      </Link>
                    </Button>
                  </div>
                  <p className="font-semibold text-base">{data.patientName}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
