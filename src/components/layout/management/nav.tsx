import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ManagementNav() {
    return (
        <Link href="/process-view">
            <Button variant="outline">
                Process View
            </Button>
        </Link>
    )
}