"use client";
import { Dispatch, SetStateAction } from "react";
import { Result } from "@/lib/types";
import Enable2FA from "./enable";
import Disable2FA from "./disable";

type Profile2FAProps = {
  loading?: boolean;
  setLoading?: Dispatch<SetStateAction<boolean>>;
  has2fa?: boolean;
  setHas2fa?: Dispatch<SetStateAction<boolean>>;
  openEnableDialog?: boolean;
  setOpenEnableDialog?: Dispatch<SetStateAction<boolean>>;
  openDisableDialog?: boolean;
  setOpenDisableDialog?: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
  setDisabled?: Dispatch<SetStateAction<boolean>>;
  className?: string;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function Profile2FAForm({
  loading,
  setLoading,
  has2fa,
  setHas2fa,
  openEnableDialog,
  setOpenEnableDialog,
  openDisableDialog,
  setOpenDisableDialog,
  disabled,
  setResult,
}: Profile2FAProps) {
  return (
    <>
      <Enable2FA
        open={openEnableDialog ?? false}
        setOpen={setOpenEnableDialog ?? (() => {})}
        loading={loading ?? false}
        setLoading={setLoading ?? (() => {})}
        has2fa={has2fa}
        setHas2fa={setHas2fa}
        setResult={setResult}
      />
      <Disable2FA
        open={openDisableDialog ?? false}
        setOpen={setOpenDisableDialog ?? (() => {})}
        loading={loading ?? false}
        setLoading={setLoading ?? (() => {})}
        has2fa={has2fa}
        setHas2fa={setHas2fa}
        setResult={setResult}
      />
    </>
  );
}
