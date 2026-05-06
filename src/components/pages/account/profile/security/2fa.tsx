"use client";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { Result } from "@/lib/types";
import Profile2FAForm from "./2fa/form";
import BackupCodeAndVerification from "./2fa/backup-code-and-verification";

type Profile2FAProps = {
  disabled?: boolean;
  setDisabled?: Dispatch<SetStateAction<boolean>>;
  className?: string;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function Profile2FA({
  disabled,
  className,
  setResult,
}: Profile2FAProps) {
  const [result, dispacthResult] = useState<Result | undefined>(undefined);
  const [verificationResult, dispacthVerificationResult] = useState<
    Result | undefined
  >(undefined);

  const [loading, setLoading] = useState(false);

  const [has2fa, setHas2fa] = useState(false);

  const [openEnableDialog, setOpenEnableDialog] = useState(false);
  const [openDisableDialog, setOpenDisableDialog] = useState(false);
  const [openBackupCodeDialog, setOpenBackupCodeDialog] = useState(false);

  const session = useSession();

  useEffect(() => {
    if (session.data?.user?.twoFactorEnabled) {
      setHas2fa(true);
    }
  }, [session.data]);

  useEffect(() => {
    if (result?.status === "success" && result?.value?.backupCodes) {
      setOpenBackupCodeDialog(true);
    }
    setResult?.(result);
  }, [result]);

  useEffect(() => {
    if (verificationResult?.status === "success") {
      setOpenBackupCodeDialog(false);
      setResult?.(verificationResult);
    }
  }, [verificationResult]);

  const handleToggle2FA = async (checked: boolean) => {
    setHas2fa(checked);
    if (checked) {
      setOpenEnableDialog(true);
    } else {
      setOpenDisableDialog(true);
    }
  };

  return (
    <>
      <div className={className}>
        <h3 className="text-md font-medium">Two-Factor Authentication</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              Enable Two-Factor Authentication
            </p>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            className="cursor-pointer"
            disabled={disabled ?? false}
            checked={has2fa}
            onCheckedChange={handleToggle2FA}
          />
        </div>
      </div>

      <Profile2FAForm
        loading={loading}
        setLoading={setLoading}
        has2fa={has2fa}
        setHas2fa={setHas2fa}
        openEnableDialog={openEnableDialog}
        setOpenEnableDialog={setOpenEnableDialog}
        openDisableDialog={openDisableDialog}
        setOpenDisableDialog={setOpenDisableDialog}
        disabled={disabled}
        setResult={dispacthResult}
      />
      <BackupCodeAndVerification
        open={openBackupCodeDialog}
        setOpen={setOpenBackupCodeDialog}
        codes={result?.value?.backupCodes}
        totp={result?.value?.totpURI}
        setResult={dispacthVerificationResult}
      />
    </>
  );
}
