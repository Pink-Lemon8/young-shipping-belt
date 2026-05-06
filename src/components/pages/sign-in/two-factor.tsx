"use client";

import { authClient } from "@/lib/auth/auth-client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Result } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type TwoFactorProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  email: string;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};
export default function TwoFactor({
  open,
  setOpen,
  email,
  setResult,
}: TwoFactorProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [trustDevice, setTrustDevice] = useState<boolean>(false);
  const [otpResult, setOtpResult] = useState<Result | undefined>(undefined);
  const router = useRouter();

  const handleCancel = () => {
    setOpen(false);
    setResult?.({
      status: "error",
      errors: [{ code: "CANCELLED", message: "Cancelled" }],
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    const result = await authClient.twoFactor.verifyTotp({
      code: code,
      trustDevice: trustDevice,
    });
    if (result?.error) {
      setOtpResult({
        status: "error",
        errors: [
          {
            code: result?.error?.code ?? "UNKNOWN_ERROR",
            message: result?.error?.message ?? "Unknown error",
          },
        ],
      });
      setLoading(false);
    } else {
      window.location.reload();
      router.refresh();
    }
  };

  return (
    <>
      <AlertDialog
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            setResult?.({
              status: "error",
              errors: [{ code: "CANCELLED", message: "Cancelled" }],
            });
          }
          setOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Two-Factor Authentication</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Please enter the code in your authenticator app
          </AlertDialogDescription>
          <div className="flex flex-col">
            {otpResult?.status &&
              otpResult.errors?.map((error, index) => (
                <p key={index} className="text-red-500">
                  {" "}
                  {error.message}
                </p>
              ))}
            {otpResult?.status &&
              otpResult.status === "success" &&
              otpResult.messages?.map((message, index) => (
                <p key={index} className="text-green-500">
                  {message}
                </p>
              ))}
          </div>
          <div className="flex flex-col items-center justify-center">
            <InputOTP
              maxLength={6}
              disabled={loading}
              onComplete={(code: string) => {
                setCode(code);
                handleComplete();
              }}
              onChange={(code: string) => setCode(code)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="flex items-center justify-center mt-4">
              <Switch
                id="trust-device"
                checked={trustDevice}
                onCheckedChange={setTrustDevice}
                className="mr-2"
              />
              <Label
                htmlFor="trust-device"
                className="text-muted-foreground mt-0.5"
              >
                Trust this device
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" disabled={loading} onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
