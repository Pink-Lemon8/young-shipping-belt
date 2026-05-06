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

type EmailOTPProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  email: string;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};
export default function EmailOTP({
  open,
  setOpen,
  email,
  setResult,
}: EmailOTPProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
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
    const result = await authClient.signIn.emailOtp({
      email: email,
      otp: code,
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
            <AlertDialogTitle>Email OTP Authentication</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Please enter the code sent to your email
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
          <div className="flex items-center justify-center">
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
                "Verify OTP"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
