
import { Badge } from "@/components/ui/badge";
import { affiliateShippingPreferences } from "@/db/schema";
import { cn } from "@/lib/utils";

const roleColors = {
    FEDEX: "text-[#ff6600] bg-[#660099]",
    CANADA_POST: "text-white bg-red-600",
    UPS: "text-[#FFB500] bg-[#351C15]",
    DEFAULT: "bg-sky-600"
}

export function AffiliateShippingPreference({ shipping }: { shipping: typeof affiliateShippingPreferences[number] }) {
    return <Badge className={cn("capitalize cursor-pointer", roleColors[shipping])}>{shipping.replace("_", " ")}</Badge>
}
