"use client";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Result } from "@/lib/types";
import { Loader2, KeyIcon } from "lucide-react";
import { motion, Variants } from "framer-motion";

type PasskeyFormProps = {
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};

export function Passkey({ setResult }: PasskeyFormProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  return (
    <>
      <MotionButton
        variant="secondary"
        variants={buttonAnimations}
        animate={error ? "error" : undefined}
        disabled={loading}
        className="mt-2 cursor-pointer w-full"
        onClick={async () => {
          setLoading?.(true);
          setError(false);
          const passkeyResult: any = await authClient.signIn.passkey();
          if (!passkeyResult?.error) {
            window.location.reload();
            router.refresh();
          } else {
            setError(true);
            setResult?.({
              status: "error",
              errors: [
                {
                  code: passkeyResult?.error?.code ?? "PASSKEY_ERROR",
                  message:
                    passkeyResult?.error?.message ??
                    "Passkey sign in failed. Please try again.",
                },
              ],
            });
            setLoading?.(false);
          }
          const timeout = setTimeout(() => {
            setError(false);
          }, 700);
          return () => clearTimeout(timeout);
        }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <KeyIcon className="w-4 h-4" />
        )}
        Passkey
      </MotionButton>
    </>
  );
}
