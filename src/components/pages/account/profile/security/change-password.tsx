import { Button } from "@/components/ui/button";
import { Result } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState, Dispatch, SetStateAction, useEffect } from "react";
import ChangePasswordDialog from "./change-password/dialog";

type ProfileChangePasswordProps = {
    disabled?: boolean;
    className?: string;
    setResult?: Dispatch<SetStateAction<Result | undefined>>;
}

export default function ChangePassword({ disabled, className, setResult }: ProfileChangePasswordProps) {
    const [result, dispacthResult] = useState<Result | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);

    useEffect(() => {
        setResult?.(result)
    }, [result, setResult])

    return (
        <>
            <div className={className}>
                <div className={"flex flex-row items-center justify-between"}>
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium">Change Password</p>
                        <p className="text-sm text-muted-foreground">Change your password to a new one</p>
                    </div>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                        <Button className="cursor-pointer" disabled={disabled || loading} onClick={() => setOpenChangePasswordDialog(true)}>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Change Password"}
                        </Button>
                    }
                </div>
            </div>

            <ChangePasswordDialog open={openChangePasswordDialog} setOpen={setOpenChangePasswordDialog} loading={loading} setLoading={setLoading} result={result} setResult={dispacthResult} disabled={disabled} />

        </>
    )
}