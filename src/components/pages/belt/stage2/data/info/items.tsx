"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Package2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Unique key per order line (same package in different orders = different keys) */
function getItemKey(item: { orderId?: string; packageId: string }): string {
  return `${item.orderId ?? ""}-${item.packageId}`;
}

type InfoItemProps = {
  items: any[];
};

export function InfoItems({ items }: InfoItemProps) {
  const itemsByOrderId = useMemo(() => {
    const map: Record<string, any[]> = {};
    const order: string[] = [];
    items?.forEach((item: any) => {
      const id = item.orderId;
      if (!map[id]) {
        map[id] = [];
        order.push(id);
      }
      map[id].push(item);
    });
    return { map, order };
  }, [items]);

  return (
    <div>
      <div className="text-sm font-medium mb-2 flex items-center gap-2">
        <Package2 className="h-4 w-4" />
        <span>Items</span>
        <Badge variant="outline" className="ml-2">
          {items?.length || 0}
        </Badge>
      </div>
      <div className="rounded-md border">
        {items?.length === 0 ? (
          <ul className="divide-y">
            <li className="w-full flex justify-center items-center p-6">
              <p className="text-sm text-muted-foreground">No items found</p>
            </li>
          </ul>
        ) : (
          itemsByOrderId.order.map((orderId, index) => (
            <div key={orderId}>
              {itemsByOrderId.order.length > 1 && (
                <div
                  className={cn(
                    "px-4 py-2 bg-muted/50 border-b font-medium text-sm text-muted-foreground",
                    index !== 0 && "border-t",
                  )}
                >
                  Order <span className="font-bold">#{orderId}</span>
                </div>
              )}
              <ul className="divide-y">
                {itemsByOrderId.map[orderId].map((item: any) => (
                  <li
                    key={getItemKey(item)}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className="bg-primary/10 rounded-full p-3 shrink-0">
                        <span className="font-bold text-primary">
                          {item.packageId ?? "N/A"}
                        </span>
                      </div>
                      <div className="grow">
                        <p className="font-medium text-sm md:text-base line-clamp-2 text-balance">
                          {item.description ?? "N/A"}
                        </p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground text-lg font-bold px-3 py-1.5 ml-2">
                        x{item.quantity ?? "N/A"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
