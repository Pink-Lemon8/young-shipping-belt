import { SetStateAction, Dispatch, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangleIcon, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DialogContent,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { Result } from "@/lib/types";
import { InputOTPGroup, InputOTPSeparator } from "@/components/ui/input-otp";
import { InputOTPSlot } from "@/components/ui/input-otp";
import { InputOTP } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth/auth-client";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type BackupCodeProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  codes?: string[] | undefined;
  totp?: string | undefined;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function BackupCodeAndVerification({
  open,
  setOpen,
  codes,
  totp,
  setResult,
}: BackupCodeProps) {
  const [verificationResult, setVerificationResult] = useState<
    Result | undefined
  >(undefined);
  const [openVerification, setOpenVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");

  const handleCopy = () => {
    if (codes) navigator.clipboard.writeText(codes.join("\n"));
    toast.success("Backup codes are copied to clipboard");
  };

  useEffect(() => {
    if (verificationResult?.status === "success") {
      setOpenVerification(false);
    }
    setResult?.(verificationResult);
  }, [verificationResult]);

  const handleCancel = () => {
    setOpenVerification(false);
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
    });
    if (result?.error) {
      setVerificationResult({
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
      setOpenVerification(false);
      setOpen(false);
      setLoading(false);
      setResult?.({
        status: "success",
        messages: ["Two-factor authentication enabled"],
      });
      toast.success("Two-factor authentication is enabled successfully");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>TOTP QR Code and Backup Codes</DialogTitle>
            <DialogDescription>
              Backup codes are used to access your account if you lose your
              phone.
              <br />
              <span className="text-sm text-destructive">
                Backup codes are not recoverable.
              </span>
              <br />
              <span className="text-sm text-destructive flex items-center gap-2 border border-red-500 py-0.5 px-2 rounded-md">
                <AlertTriangleIcon className="w-12 h-12" />
                Scan the QR code with your authenticator app or enter the backup
                codes and verify to enable two-factor authentication.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 overflow-y-auto max-h-[65vh] pb-4">
            {totp && (
              <div className="flex flex-col w-full h-64 items-center justify-center drop-shadow-md border border-gray-200 rounded-md gap-2  p-4">
                <Label htmlFor="backup-codes">TOTP QR Code</Label>
                <Separator className="px-12 mb-4" />
                <QRCode className="w-full h-full" value={totp} />
              </div>
            )}
            <div
              id="backup-codes"
              className="flex flex-col w-full items-center justify-center drop-shadow-md border border-gray-200 rounded-md gap-2 p-4"
            >
              <Label htmlFor="backup-codes">Backup Codes</Label>
              <Separator className="px-12 mb-4" />

              {codes?.map((code: string, index: number) => {
                const formattedCode =
                  code.length === 11
                    ? `${code.slice(0, 5)}-${code.slice(6)}`
                    : code;

                return (
                  <div
                    key={code}
                    className={cn(
                      "text-lg font-mono tracking-wider text-muted-foreground w-full text-center py-1",
                      index % 2 === 0 && "text-primary"
                    )}
                  >
                    {formattedCode}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={false}
              onClick={handleCopy}
              className="cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copy Backup Codes
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => setOpenVerification(true)}
            >
              Verify Two-Factor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openVerification} onOpenChange={setOpenVerification}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Verify Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Verify your two-factor authentication.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col">
            {verificationResult?.status &&
              verificationResult.errors?.map((error, index) => (
                <p key={index} className="text-red-500">
                  {" "}
                  {error.message}
                </p>
              ))}
            {verificationResult?.status &&
              verificationResult.status === "success" &&
              verificationResult.messages?.map((message, index) => (
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

          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
