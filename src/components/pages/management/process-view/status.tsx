import { Badge } from "@/components/ui/badge";
import { beltQueueStatusTypes } from "@/db/schema";
import { cn } from "@/lib/utils";

const statusColors = {
    PENDING: "bg-emerald-600",
    SENT_TO_BELT: "bg-yellow-600",
    STAGE1: "bg-purple-600",
    STAGE2: "bg-blue-600",
    STAGE3: "bg-pink-600",
    COMPLETED: "bg-green-600",
    FAILED: "bg-red-600",
}

export function Status({ status }: { status: typeof beltQueueStatusTypes[number] }) {
    return <Badge className={cn("capitalize cursor-pointer", statusColors[status])}>{status.replaceAll("_", " ")}</Badge>
}
