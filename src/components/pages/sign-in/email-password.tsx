"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { authenticate } from "./action";
import { Result } from "@/lib/types";
import { Loader2 } from "lucide-react";
import TwoFactor from "./two-factor";
import { MagicLink } from "./magic-link";
import { motion, Variants } from "framer-motion";

export function EmailPasswordForm({
  setResult,
}: {
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
}) {
  const [result, dispatch] = useActionState<Result | undefined, FormData>(
    authenticate,
    undefined
  );
  const [email, setEmail] = useState<string>("");
  const [twoFactorResult, setTwoFactorResult] = useState<Result | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [error, setError] = useState(false);
  const MotionButton = motion(Button);
  const buttonAnimations = {
    error: {
      x: [0, -8, 8, -6, 6, -4, 4, -2, 2, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  } as Variants;

  useEffect(() => {
    if (result?.status === "success") {
      if (result?.value?.twoFactorRedirect) {
        setOpen(true);
      } else {
        window.location.reload();
        router.refresh();
      }
    } else if (result?.status === "error") {
      setError(true);
    }
    setLoading(false);
    setResult?.(result);
    const timeout = setTimeout(() => {
      setError(false);
    }, 700);
    return () => clearTimeout(timeout);
  }, [result]);

  useEffect(() => {
    if (twoFactorResult !== undefined) {
      if (twoFactorResult?.status === "success") {
        window.location.reload();
        router.refresh();
      } else {
        setError(true);
        setLoading(false);
      }
    }
    setResult?.(twoFactorResult);
    const timeout = setTimeout(() => {
      setError(false);
    }, 700);
    return () => clearTimeout(timeout);
  }, [twoFactorResult]);

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    startTransition(() => {
      dispatch(new FormData(event.currentTarget));
    });
  };

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || isPending}
            className="border border-black/40 rounded-md transition-all duration-300 placeholder:text-foreground/50"
          />
          {result?.errors?.find((error) => error.field === "email") && (
            <p className="text-sm text-red-500">
              {result.errors.find((error) => error.field === "email")?.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              name="password"
              autoComplete="on"
              disabled={loading || isPending}
              className="border border-black/40 rounded-md transition-all duration-300 placeholder:text-foreground/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  formRef.current?.dispatchEvent(
                    new Event("submit", { bubbles: true, cancelable: true })
                  );
                }
              }}
            />
            <MagicLink
              email={email}
              loading={loading}
              setLoading={setLoading}
              setEmail={setEmail}
              setResult={setResult}
              className="absolute right-0 top-0"
            />
          </div>
          {result?.errors?.find((error) => error.field === "password") && (
            <p className="text-sm text-red-500">
              {
                result.errors.find((error) => error.field === "password")
                  ?.message
              }
            </p>
          )}
        </div>
        <MotionButton
          variants={buttonAnimations}
          animate={error ? "error" : undefined}
          type="submit"
          className="w-full cursor-pointer"
          disabled={loading || isPending}
        >
          {loading || isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Sign In"
          )}
        </MotionButton>
      </form>
      <TwoFactor
        open={open}
        setOpen={setOpen}
        email={email}
        setResult={setTwoFactorResult}
      />
    </>
  );
}
