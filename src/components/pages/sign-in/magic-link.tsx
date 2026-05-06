import { Result } from "@/lib/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { Check, Mail } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";

type MagicLinkFormProps = {
  className?: string;
  email: string;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};

export function MagicLink({
  className,
  email,
  loading,
  setLoading,
  setEmail,
  setResult,
}: MagicLinkFormProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

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

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMagicLinkLoading(true);
    setError(false);
    if (!email || email === "") {
      setResult?.({
        status: "error",
        errors: [
          {
            code: "EMAIL_REQUIRED",
            field: "email",
            message: "Email is required for magic link",
          },
        ],
      });
      setMagicLinkLoading(false);
      setError(true);
      const timeout = setTimeout(() => {
        setError(false);
      }, 700);
      return () => clearTimeout(timeout);
    }

    const result = await authClient.signIn.magicLink({
      email: email,
      callbackURL: "/dashboard",
    });
    if (!result?.error) {
      setEmailSent(true);
      toast.success("Magic link is being sent to your email");
      setResult?.({
        status: "success",
        messages: ["Magic link is being sent to your email"],
      });
    } else {
      const errorMessage: any = result?.error;
      setError(true);
      if (
        errorMessage &&
        errorMessage?.details &&
        errorMessage?.details?.length > 0
      ) {
        setResult?.({
          status: "error",
          errors: [
            {
              code: "DETAILS_ERROR",
              message:
                errorMessage?.details?.[0]?.message ??
                "Validation error. Please check your email address.",
            },
          ],
        });
      } else {
        setResult?.({
          status: "error",
          errors: [
            {
              code: errorMessage?.code,
              message:
                errorMessage?.message ?? "Sign in failed. Please try again.",
            },
          ],
        });
      }
    }
    setMagicLinkLoading(false);
    const timeout = setTimeout(() => {
      setError(false);
    }, 700);
    return () => clearTimeout(timeout);
  };

  useEffect(() => {
    if (emailSent) {
      const timeout = setTimeout(() => {
        setEmailSent(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [emailSent]);

  return (
    <>
      <MotionButton
        variants={buttonAnimations}
        animate={error ? "error" : undefined}
        className={cn(
          "cursor-pointer",
          emailSent ? "bg-green-600 text-white" : "",
          loading ? "animate-pulse" : "",
          className
        )}
        variant="outline"
        disabled={loading || emailSent || magicLinkLoading}
        onClick={handleSubmit}
      >
        {emailSent === false ? (
          magicLinkLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )
        ) : (
          <Check className="w-4 h-4" />
        )}
        Magic Link
      </MotionButton>
    </>
  );
}
