"use client"

import { Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type AffiliateInfoProps = {
    affiliate: any
}

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
    )
}