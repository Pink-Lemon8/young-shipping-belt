"use client";

import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AffiliateInfoProps = {
  affiliate: any;
};

export function InfoAffiliate({ affiliate }: AffiliateInfoProps) {
  return (
    <div className="bg-primary/5 rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-full p-2">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Affiliate</p>
          <p className="font-semibold">{affiliate?.name ?? "N/A"}</p>
        </div>
      </div>
    </div>
  );
}

export function InfoLymlight({
  organization,
}: {
  organization: {
    id: string;
    name: string;
    shortName: string;
    publicLogo: string;
    slug: string;
  };
}) {
  return (
    <div className="bg-primary/5 rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="w-full flex items-center gap-3">
        <div
          className={cn(
            "rounded-full",
            organization?.publicLogo ? "" : "bg-primary/10 p-2"
          )}
        >
          {organization?.publicLogo ? (
            <img
              src={organization?.publicLogo}
              alt={organization?.name}
              width={120}
              className="object-cover"
            />
          ) : (
            <Building2 className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            Order Source{" "}
            <span className="text-primary font-semibold">(Lymlight)</span>
          </p>
          <p className="font-semibold">{organization?.name ?? "Lymlight"}</p>
        </div>
      </div>
      <div className="flex justify-end">
        {organization?.shortName ? (
          <Badge variant="outline" className="px-2 py-1">
            {organization?.shortName}
          </Badge>
        ) : undefined}
      </div>
    </div>
  );
}
