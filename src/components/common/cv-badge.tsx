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
        "border border-[#d1a5cc]/30 bg-[#d1a5cc]/15 text-[#d1a5cc] hover:bg-[#d1a5cc]/20 font-bold px-2 py-0.5 text-xs",
        className,
      )}
    >
      YY
    </Badge>
  );
}
