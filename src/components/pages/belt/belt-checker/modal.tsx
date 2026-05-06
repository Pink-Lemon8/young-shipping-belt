"use client"
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Result } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/hooks/use-toast";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function BeltCheckerModal({ currentBeltCode = undefined, userBeltCode = undefined, open = false, setOpen = undefined }:
    { currentBeltCode?: string, userBeltCode?: string, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {

    const [loading, setLoading] = useState<boolean>(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!currentBeltCode?.includes(userBeltCode ?? "")) {
            setOpen?.(true);
        }
    }, [currentBeltCode, userBeltCode]);

    return <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>!! Alert !!</AlertDialogTitle>
                <AlertDialogDescription>
                    This is not your belt. Do you want to work on this belt?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={loading} onClick={() => { router.push(userBeltCode ?? "") }}>Back to your belt ({userBeltCode})</AlertDialogCancel>

                {/* <Button variant="default" onClick={(e) => { setLoading(true); setOpen?.(false) }} disabled={loading}>
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Continue...</> : "Yes, Continue"}
                </Button> */}

            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
}