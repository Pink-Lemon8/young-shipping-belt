import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Result } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Enable2FAProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  has2fa?: boolean;
  setHas2fa?: Dispatch<SetStateAction<boolean>>;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function Enable2FA({
  open = false,
  setOpen,
  loading = false,
  setLoading,
  has2fa = false,
  setHas2fa,
  setResult,
}: Enable2FAProps) {
  const [password, setPassword] = useState("");

  const [result, dispacthResult] = useState<Result | undefined>(undefined);

  const handleEnable2FA = async () => {
    if (!password || password.length === 0 || password.length < 8) {
      dispacthResult({
        status: "error",
        messages: ["Please enter a valid password, minimum 8 characters"],
      });
      return;
    }

    setLoading(true);
    authClient.twoFactor
      .enable({
        password: password,
      })
      .then(async (res) => {
        const { data, error } = res;
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
                  "Failed to enable two-factor authentication",
              ],
            });
          } else {
            dispacthResult({
              status: "error",
              messages: [
                errorMessage?.message ??
                  "Failed to enable two-factor authentication",
              ],
            });
          }
          setResult?.({
            status: "error",
            messages: [
              errorMessage?.message ??
                "Failed to enable two-factor authentication",
            ],
          });
          setLoading(false);
          return;
        }
        dispacthResult({
          status: "success",
          messages: ["Two-factor authentication is ready to enable"],
          value: data,
        });
        setResult?.({
          status: "success",
          messages: ["Two-factor authentication is ready to enable"],
          value: data,
        });
        clear();
      });
  };

  const clear = () => {
    dispacthResult(undefined);
    setLoading(false);
    setPassword("");
    setHas2fa?.(false);
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
              Enable Two-Factor Authentication
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
          <div>
            <Input
              type="password"
              placeholder="Enter your password"
              autoComplete="off"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEnable2FA();
                }
              }}
            />
          </div>

          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => clear()}
            >
              Cancel
            </Button>
            <Button onClick={handleEnable2FA} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Enable"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
