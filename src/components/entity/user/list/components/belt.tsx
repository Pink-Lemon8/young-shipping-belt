"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const beltColors = {
  A: "bg-purple-600",
  A1: "bg-purple-600",
  A2: "bg-purple-600",
  A3: "bg-purple-600",
  B: "bg-blue-600",
  B1: "bg-blue-600",
  B2: "bg-blue-600",
  B3: "bg-blue-600",
  C: "bg-emerald-600",
  C1: "bg-emerald-600",
  C2: "bg-emerald-600",
  C3: "bg-emerald-600",
  D: "bg-amber-600",
  D1: "bg-amber-600",
  D2: "bg-amber-600",
  D3: "bg-amber-600",
  DEFAULT: "bg-gray-600",
  YES: "bg-green-600",
  NO: "bg-red-600",
};

export function Belt({
  beltCode,
  className,
}: {
  beltCode: string;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "capitalize cursor-pointer",
        beltColors[beltCode as keyof typeof beltColors],
        className,
      )}
    >
      {beltCode}
    </Badge>
  );
}
