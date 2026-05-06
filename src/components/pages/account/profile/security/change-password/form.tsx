import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { Result } from "@/lib/types";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
type ChangePasswordFormProps = {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

const newPasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "New password and confirm password do not match",
  });

export default function ChangePasswordForm({
  loading,
  setLoading,
  disabled,
  setResult,
}: ChangePasswordFormProps) {
  const [result, dispatch] = useState<Result | undefined>(undefined);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setResult?.(result);
  }, [result]);

  const handleChangePassword = async () => {
    setShowNewPassword(false);
    setLoading(true);
    const validation = newPasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!validation.success) {
      const errors = validation.error.errors;
      dispatch({
        status: "error",
        errors: errors.map((error) => ({
          code: error.code,
          field: error.path[0] as string,
          message: error.message,
        })),
      });
      setLoading(false);
      return;
    }

    const res = await authClient.changePassword({
      newPassword: validation.data.newPassword,
      currentPassword: validation.data.currentPassword,
      revokeOtherSessions: true,
    });

    if (res.error) {
      dispatch({
        status: "error",
        errors: [
          {
            code: res.error.code ?? "WRONG_CURRENT_PASSWORD",
            field: "currentPassword",
            message:
              res.error.message ?? "Please enter a valid current password",
          },
        ],
      });
      setLoading(false);
      return;
    }

    dispatch({
      status: "success",
      messages: ["Password changed successfully"],
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password changed successfully");
    setLoading(false);
  };

  const generatePassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setNewPassword(password);
    setShowNewPassword(true);
    navigator.clipboard
      .writeText(password)
      .then(() => {
        toast.success("New password copied to clipboard");
      })
      .catch((err) => {
        toast.error("Failed to copy new password to clipboard");
      });
  };

  return (
    <>
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            disabled={disabled || loading}
            className={disabled || loading ? "bg-muted" : ""}
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleChangePassword();
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <div className="relative mt-3">
            <Label htmlFor="new-password">New Password</Label>
            <Button
              onClick={generatePassword}
              disabled={disabled || loading}
              className="absolute cursor-pointer right-0 top-0 -translate-y-1/2"
            >
              Generate
            </Button>
          </div>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              disabled={disabled || loading}
              className={disabled || loading ? "bg-muted" : ""}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleChangePassword();
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled || loading}
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute px-6 cursor-pointer right-0 top-1/2 -translate-y-1/2"
            >
              {showNewPassword ? (
                <EyeOffIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            disabled={disabled || loading}
            className={disabled || loading ? "bg-muted" : ""}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleChangePassword();
              }
            }}
          />
        </div>
      </div>
      <Button
        disabled={disabled || loading}
        className="w-full cursor-pointer"
        onClick={handleChangePassword}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
          </>
        ) : (
          "Change Password"
        )}
      </Button>
    </>
  );
}
