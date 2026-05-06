"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const boxTypeColors = {
  COLD_CHAIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DRY_MEDS:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  DEFAULT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export function BoxTypeBadge({
  type,
  className,
}: {
  type?: string | null;
  className?: string;
}) {
  const safeType = type ?? "DEFAULT";
  return (
    <Badge
      className={cn(
        "capitalize",
        boxTypeColors[safeType as keyof typeof boxTypeColors] ??
          boxTypeColors.DEFAULT,
        className,
      )}
    >
      {safeType.replaceAll("_", " ")}
    </Badge>
  );
}
