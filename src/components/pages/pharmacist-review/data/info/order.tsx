"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, User, MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

type OrderInfoProps = {
    data: any
}

export function InfoOrder({ data }: OrderInfoProps) {
    // Format address components
    const formatAddress = () => {
        const addr = data.shippingAddress;
        const parts = [
            addr['momex:address']._cdata,
            addr['momex:address2']._cdata || null,
            addr['momex:address3']._cdata || null,
            `${addr['momex:city']._cdata}, ${addr['momex:state']._cdata} ${addr['momex:postalcode']._cdata}`
        ].filter(Boolean);
        
        return parts.join(", ");
    }
    
    return (
        <Card className="border border-muted/60">
            <CardContent className="p-4">
                <div className="grid sm:grid-cols-2 gap-6">
                    {/* Order ID Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            <h3 className="font-medium text-primary">Order Information</h3>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-base">{data.orderId}</p>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    asChild 
                                    className="h-8 w-8 p-0"
                                >
                                    <Link href={`https://cvp.pharmacywire.com/momex/NavCode/admin.cart.${data.status}.view/CartID/${data.orderId}`} target="_blank">
                                        <ExternalLink className="h-4 w-4" />
                                        <span className="sr-only">View in system</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        
                        {/* Patient Section */}
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Patient</p>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full inline-block mb-1">
                                        {data.patientId}
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        asChild 
                                        className="h-8 w-8 p-0"
                                    >
                                        <Link 
                                            href={`https://cvp.pharmacywire.com/momex/NavCode/admin.customers.view/UserID/${data.patientId}`} 
                                            target="_blank"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            <span className="sr-only">View patient in system</span>
                                        </Link>
                                    </Button>
                                </div>
                                <p className="font-semibold text-base">
                                    {data.patient['momex:firstname']._cdata} {data.patient['momex:lastname']._cdata}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Shipping Address Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h3 className="font-medium text-primary">Shipping Address</h3>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg h-[calc(100%-32px)] flex items-center">
                            <p className="font-medium text-balance leading-relaxed">
                                {formatAddress()}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}