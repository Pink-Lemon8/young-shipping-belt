import { Button } from "@/components/ui/button";
import { Key, Plus } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Result } from "@/lib/types";
import { PasskeyDialog } from "./passkey/dialog";

type PasskeyProps = {
  disabled?: boolean;
  setDisabled?: Dispatch<SetStateAction<boolean>>;
  className?: string;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function ProfilePasskey({
  disabled,
  setDisabled,
  className,
  setResult,
}: PasskeyProps) {
  const [openPasskeyDialog, setOpenPasskeyDialog] = useState(false);

  useEffect(() => {
    if (!openPasskeyDialog) {
      setDisabled?.(false);
    }
  }, [openPasskeyDialog]);

  return (
    <>
      <div className={className}>
        <h3 className="text-md font-medium">Passkey Authentication</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enable Passkey Authentication</p>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Button
            className="cursor-pointer"
            disabled={disabled}
            onClick={() => setOpenPasskeyDialog(true)}
          >
            <Key className="w-4 h-4" />
            Manage Passkeys
          </Button>
        </div>
      </div>
      <PasskeyDialog
        setDisabled={setDisabled}
        open={openPasskeyDialog}
        onOpenChange={setOpenPasskeyDialog}
        setResult={setResult}
      />
    </>
  );
}
