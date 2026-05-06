"use client";

import * as React from "react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import { Result } from "@/lib/types";
import { useEffect, useState } from "react";

export function ErrorDialog({
    result,
    setResult,
    actionLabel = "Understand",
}: {
    result: Result | undefined;
    setResult: React.Dispatch<React.SetStateAction<Result | undefined>>;
    actionLabel?: string;
}) {
    const [open, setOpen] = useState(false);

    const errorMessages = React.useMemo(() => {
        if (!result) return [];
        const fromMessages = result.messages ?? [];
        const fromErrors = (result.errors ?? []).map((e) => e.message);
        return [...fromMessages, ...fromErrors];
    }, [result]);

    useEffect(() => {
        if (result && result.status === "error")
            setOpen(true);
    }, [result]);
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="text-destructive h-6 w-6" aria-hidden="true" />
                        <AlertDialogTitle>Something went wrong</AlertDialogTitle>
                    </div>
                </AlertDialogHeader>
                <div className="space-y-2 pt-2">
                    {errorMessages.length === 0 ? (
                        <p>Something went wrong.</p>
                    ) : (
                        errorMessages.map((msg, idx) => (
                            <div key={idx} className="text-destructive">
                                {msg}
                            </div>
                        ))
                    )}
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction
                        className="bg-destructive text-background hover:bg-destructive/80"
                        onClick={() => {
                            setOpen(false);
                            setResult(undefined);
                        }}
                    >
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}