"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Result } from "@/lib/types";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { ForgetPasswordAction } from "./action";

export function ForgetPasswordForm({
  setResult,
}: {
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
}) {
  const MotionButton = motion.create(Button);
  const [response, setResponse] = useState<Result | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [errorEmail, setErrorEmail] = useState<string | undefined>(undefined);

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.2 } },
  };
  const handleSubmit = async () => {
    if (errorEmail !== undefined || email.trim() === "") return;
    setIsLoading(true);

    setResponse(undefined);
    setErrorEmail(undefined);

    const result = await ForgetPasswordAction(email);
    setResponse(result);
    setResult?.(result);
    setIsLoading(false);

    if (result?.status === "success") {
      setEmail("");
    }
  };

  return (
    <div>
      {response?.status === "error" && (
        <div className="bg-red-600 text-white p-2 rounded-lg my-4 font-medium flex items-start justify-start gap-2">
          <AlertCircle className="min-w-5 min-h-5" />
          {response.messages?.[0]}
        </div>
      )}

      {response?.status === "success" &&
        response?.messages !== undefined &&
        response?.messages.length > 0 && (
          <div className="bg-green-600 text-white p-2 rounded-lg my-4 font-medium flex items-start justify-start gap-2">
            <CheckCircle className="min-w-5 min-h-5" />
            {response?.messages[0]}
          </div>
        )}

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="you@example.com"
          className={`border border-black/40 rounded-md placeholder:text-foreground/50 transition-all duration-300 ${
            errorEmail !== undefined
              ? "outline-4 focus:outline-red-500 invalid:outline-red-500 focus:invalid:outline-red-500"
              : ""
          }`}
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(e.target.value)) {
              setErrorEmail("Invalid email address");
            } else {
              setErrorEmail(undefined);
            }
            setEmail(e.target.value);
          }}
        />
      </div>

      <MotionButton
        type="submit"
        onClick={() => {
          handleSubmit();
        }}
        className="w-full mt-4"
        variants={buttonVariants}
        disabled={isLoading}
        whileHover="hover"
        whileTap="tap"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin mr-2" /> Sending...
          </>
        ) : (
          "Send Reset Email"
        )}
      </MotionButton>
    </div>
  );
}
