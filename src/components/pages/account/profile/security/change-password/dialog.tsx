import { Result } from "@/lib/types";
import { Dispatch, SetStateAction, useEffect } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ChangePasswordForm from "./form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ChangePasswordDialogProps = {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    disabled?: boolean;
    result?: Result | undefined;
    setResult?: Dispatch<SetStateAction<Result | undefined>>;
}

export default function ChangePasswordDialog({ open, setOpen, loading, setLoading, result, setResult, disabled }: ChangePasswordDialogProps) {

    useEffect(() => {
        if (result?.status === "success") {
            setOpen(false);
        }
    }, [result]);

    const clear = () => {
        setResult?.(undefined);
        setLoading(false);
        setOpen(false);
    }
    return (
        <>
            <AlertDialog open={open} onOpenChange={(open) => {
                if (loading) return;
                if (!open) {
                    setOpen(open);
                    clear();
                }
                setOpen(open);
            }}>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change Password</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                        Please enter your current password and new password
                    </AlertDialogDescription>

                    <div className="flex flex-col">
                        {result?.status && result.errors?.map((error, index) => (
                            <p key={index} className="text-red-500">{error.message}</p>
                        ))}
                        {result?.status && result.status === "success" && result.messages?.map((message, index) => (
                            <p key={index} className="text-green-500">{message}</p>
                        ))}
                    </div>

                    <ChangePasswordForm loading={loading} setLoading={setLoading} disabled={disabled} setResult={setResult} />
                    <AlertDialogFooter>
                        <Button disabled={loading || disabled} className="w-full cursor-pointer" variant="outline" onClick={clear}>Cancel</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}