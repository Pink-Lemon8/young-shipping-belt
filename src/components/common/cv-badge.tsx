import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CvBadge({
  isCv = true,
  className,
}: {
  isCv?: boolean | null;
  className?: string;
}) {
  if (!isCv) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "border border-[#3B82F6]/30 bg-[#3B82F6]/15 text-[#3B82F6] hover:bg-[#3B82F6]/20 font-bold px-2 py-0.5 text-xs",
        className,
      )}
    >
      YY
    </Badge>
  );
}
