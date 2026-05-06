"use client"

import { measurementString } from "@/lib/utils"
import { PackageOpen, SquareStack, FileText, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type BoxInfoProps = {
    BoxSize: any
}

export function InfoBoxSize({ BoxSize }: BoxInfoProps) {
    const boxType = BoxSize?.type === "COLD_CHAIN"
        ? { label: "Cold Chain", color: "bg-blue-100 text-blue-800" }
        : BoxSize?.type === "DRY_MEDS"
            ? { label: "Dry Meds", color: "bg-amber-100 text-amber-800" }
            : { label: "Default", color: "bg-slate-100 text-slate-800" }

    return (
        <Card className="border border-muted/60">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <PackageOpen className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Box Information</h3>
                    </div>
                    <Badge className={boxType.color}>{boxType.label}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <SquareStack className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Name</p>
                        </div>
                        <p className="font-medium pl-6">{BoxSize?.name ?? "N/A"}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">(W × H × L)</p>
                        </div>
                        <p className="font-medium pl-6">
                            {BoxSize?.w ? BoxSize?.w : "N/A"} × {BoxSize?.h ? BoxSize?.h : "N/A"} × {BoxSize?.l ? BoxSize?.l : "N/A"}
                            {" " + measurementString(BoxSize?.unit ?? "IN")}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Description</p>
                        </div>
                        <p className="font-medium pl-6 text-sm text-balance">
                            {BoxSize?.description ?? "No description available"}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
