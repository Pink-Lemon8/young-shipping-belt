import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { Dispatch, SetStateAction, useState } from "react";
import { Loader2 } from "lucide-react";
import { Result } from "@/lib/types";
import { cn } from "@/lib/utils";

type Disable2FAProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  has2fa?: boolean;
  setHas2fa?: Dispatch<SetStateAction<boolean>>;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};
export default function Disable2FA({
  open,
  setOpen,
  loading,
  setLoading,
  has2fa,
  setHas2fa,
  setResult,
}: Disable2FAProps) {
  const [result, dispacthResult] = useState<Result | undefined>(undefined);
  const [password, setPassword] = useState("");

  const handleDisable2FA = async () => {
    if (!password || password.length === 0 || password.length < 8) {
      dispacthResult({
        status: "error",
        messages: ["Please enter a valid password, minimum 8 characters"],
      });
      return;
    }

    setLoading(true);
    authClient.twoFactor
      .disable({
        password: password,
      })
      .then(async (res) => {
        const { error } = res;
        if (error) {
          const errorMessage: any = error;
          if (
            errorMessage &&
            errorMessage?.details &&
            errorMessage?.details?.length > 0
          ) {
            dispacthResult({
              status: "error",
              messages: [
                errorMessage?.details?.[0]?.message ??
                  "Failed to disable two-factor authentication",
              ],
            });
          } else {
            dispacthResult({
              status: "error",
              messages: [
                errorMessage?.message ??
                  "Failed to disable two-factor authentication",
              ],
            });
          }
          setResult?.({
            status: "error",
            messages: [
              errorMessage?.message ??
                "Failed to disable two-factor authentication",
            ],
          });
          setLoading(false);
          return;
        }
        toast.success("Two-factor authentication is disabled successfully");
        dispacthResult({
          status: "success",
          messages: ["Two-factor authentication is disabled successfully"],
        });
        setResult?.({
          status: "success",
          messages: ["Two-factor authentication is disabled successfully"],
        });
        clear();
        setHas2fa?.(false);
      });
  };

  const clear = () => {
    dispacthResult(undefined);
    setLoading(false);
    setPassword("");
    setHas2fa?.(true);
    setOpen(false);
  };

  return (
    <>
      <AlertDialog
        open={open}
        onOpenChange={(open) => {
          if (loading) return;
          if (!open) clear();
          setOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable Two-Factor Authentication
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex flex-col">
            {result?.status &&
              result.messages?.map((message, index) => (
                <p
                  key={index}
                  className={cn(
                    result.status === "success"
                      ? "text-green-500"
                      : "text-red-500"
                  )}
                >
                  {message}
                </p>
              ))}
          </div>
          <Input
            type="password"
            placeholder="Enter your password"
            autoComplete="off"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleDisable2FA();
              }
            }}
          />
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => clear()}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Disable"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
