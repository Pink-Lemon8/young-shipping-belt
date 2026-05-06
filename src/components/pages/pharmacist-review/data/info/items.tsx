"use client"

import { cn } from "@/lib/utils"
import { Package2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type InfoItemProps = {
    items: any[]
}

export function InfoItems({ items }: InfoItemProps) {
    return (
        <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Package2 className="h-4 w-4" />
                <span>Items</span>
                <Badge variant="outline" className="ml-2">{items?.length || 0}</Badge>
            </div>
            <div className="rounded-md border">
                <ul className="divide-y">
                    {items?.map((item: any, index: any) => (
                        <li key={index} className="hover:bg-accent/50 transition-colors">
                            <div className="p-4 flex items-center gap-4">
                                <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                                    <span className="font-bold text-primary">{item.packageId ?? "N/A"}</span>
                                </div>
                                <div className="flex-grow">
                                    <p className="font-medium text-sm md:text-base line-clamp-2 text-balance">{item.description ?? "N/A"}</p>
                                </div>
                                <Badge className="bg-primary text-primary-foreground text-lg font-bold px-3 py-1.5 ml-2">
                                    x{item.quantity ?? "N/A"}
                                </Badge>
                            </div>
                        </li>
                    ))}
                    {items?.length === 0 && (
                        <li className="w-full flex justify-center items-center p-6">
                            <p className="text-sm text-muted-foreground">No items found</p>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    )
}