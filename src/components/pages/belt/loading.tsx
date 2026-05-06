import { Loader2 } from "lucide-react";

export default function BeltLoading() {
    return (

        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground animate-pulse">Loading order data...</p>
        </div>
    )
}   