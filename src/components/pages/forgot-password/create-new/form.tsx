"use client";

import { useEffect, useState } from "react";
import { Result } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { ForgetPasswordCreateNewAction } from "./action";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function EditPasswordForm({ code }: { code: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<Result | undefined>(undefined);
  const [countdown, setCountdown] = useState(20);
  const router = useRouter();
  const handleSubmit = async () => {
    setError(undefined);
    setResponse(undefined);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    const result = await ForgetPasswordCreateNewAction(code, password);
    setResponse(result);
    setIsLoading(false);
    if (result?.status === "success") {
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setError(undefined);
    }
  };

  useEffect(() => {
    if (success) {
      setCountdown(20);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push("/sign-in");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [success, router]);

  return (
    <div className="space-y-4">
      {response?.status === "error" && (
        <div className="bg-red-600 text-white p-2 rounded-lg flex items-start justify-start gap-2">
          <AlertCircle className="min-w-4 min-h-4" />
          {response.messages?.[0]}
        </div>
      )}

      {response?.status === "success" && (
        <div className="bg-green-600 text-white p-2 rounded-lg flex items-start justify-start gap-2">
          <CheckCircle className="min-w-4 min-h-4" />
          <div className="w-full flex flex-row justify-between gap-2">
            <div>
              {response?.messages?.[0] ?? "Password updated successfully"}
              <div className="mt-1 text-sm w-full">
                Redirecting to sign-in page in{" "}
                <strong className="font-bold text-md">{countdown}</strong>{" "}
                second
                {countdown <= 1 ? "" : "s"}...
              </div>
            </div>

            <div className="flex justify-end px-2">
              <Link
                href="/sign-in"
                className="text-white font-bold text-base hover:underline flex items-center gap-2"
              >
                Sign In Now <ArrowRight className="min-w-4 min-h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="password">New Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            name="password"
            disabled={success}
            placeholder="New Password"
            className="transition-all duration-300 placeholder:text-foreground/50 border border-black/40 rounded-md"
            value={password}
            minLength={8}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={success}
            className="absolute right-0.5 top-0.5 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          name="confirmPassword"
          placeholder="Confirm Password"
          className="transition-all duration-300 placeholder:text-foreground/50 border border-black/40 rounded-md"
          value={confirmPassword}
          disabled={success}
          minLength={8}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setConfirmPassword(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
        />
      </div>
      {error && (
        <div className="mt-3 mb-2 px-4 py-2 rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 text-sm text-red-700 dark:text-red-300 shadow-sm flex items-center gap-2 transition-all duration-200">
          <AlertCircle className="min-w-3 min-h-3" />
          <span>{error}</span>
        </div>
      )}
      <Button
        type="submit"
        onClick={handleSubmit}
        className="w-full mt-4 cursor-pointer"
        disabled={isLoading || success}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin mr-2" />
            Updating...
          </>
        ) : (
          "Update Password"
        )}
      </Button>
    </div>
  );
}
