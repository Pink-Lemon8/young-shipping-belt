import { Badge } from "@/components/ui/badge";
import { pharmacistReviewStatusTypes } from "@/db/schema";
import { cn } from "@/lib/utils";

const statusColors = {
  PENDING: "bg-yellow-600",
  APPROVED: "bg-green-600",
  DENIED: "bg-red-600",
};

export function PharmacistReviewStatus({
  status,
}: {
  status: (typeof pharmacistReviewStatusTypes)[number];
}) {
  return (
    <Badge
      className={cn("capitalize cursor-pointer m-1", statusColors[status])}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}
