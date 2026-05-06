"use client";

import { measurementString } from "@/lib/utils";
import { PackageOpen, SquareStack, FileText, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BoxTypeBadge } from "@/components/common/box-type-badge";

type BoxInfoProps = {
  BoxSize: any;
  tempaidBoxId?: number | undefined;
};

export function InfoBoxSize({
  BoxSize,
  tempaidBoxId = undefined,
}: BoxInfoProps) {
  return (
    <Card className="border border-muted/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PackageOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Box Information</h3>
          </div>
          <BoxTypeBadge type={BoxSize?.type} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SquareStack className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Name</p>
            </div>
            <p className="font-medium pl-6">{BoxSize?.name ?? "N/A"}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">(W × H × L)</p>
            </div>
            <p className="font-medium pl-6">
              {BoxSize?.w ? BoxSize?.w : "N/A"} ×{" "}
              {BoxSize?.h ? BoxSize?.h : "N/A"} ×{" "}
              {BoxSize?.l ? BoxSize?.l : "N/A"}
              {" " + measurementString(BoxSize?.unit ?? "IN")}
            </p>
          </div>
          {BoxSize?.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Description</p>
              </div>
              <p className="font-medium pl-6 text-sm text-balance">
                {BoxSize?.description}
              </p>
            </div>
          )}
          {tempaidBoxId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tempaid Box ID</p>
              </div>
              <p className="font-medium pl-6 text-balance">{tempaidBoxId}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
