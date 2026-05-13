"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmailPasswordForm } from "./email-password";
import { Passkey } from "./passkey";
import { Result } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { AlertCircle, CheckCircle } from "lucide-react";

type SignInCardProps = {
  className?: string;
};

export function SignInCard({ className }: SignInCardProps) {
  const router = useRouter();
  const [result, setResult] = useState<Result | undefined>(undefined);
  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="Young Shipping Belt"
            width={48}
            height={48}
            className="rounded-md"
          />
          Young Shipping Belt
        </CardTitle>
        <CardDescription className="text-foreground/50">
          Sign in to your account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col">
          {result?.status && result.status === "error" && (
            <div className="flex flex-col justify-start items-start gap-2 bg-red-600 p-2 rounded-md">
              {result.errors?.map((error, index) => (
                <p
                  key={index}
                  className="text-white text-sm flex items-center gap-2"
                >
                  <AlertCircle className="min-w-4 min-h-4" />
                  {error.message}
                </p>
              ))}
            </div>
          )}

          {result?.status &&
            result.status === "success" &&
            result.messages &&
            result.messages.length > 0 && (
              <div className="flex flex-col justify-start items-start gap-2 bg-green-600 p-2 rounded-md">
                {result.messages?.map((message, index) => (
                  <p
                    key={index}
                    className="text-white text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="min-w-4 min-h-4" />
                    {message}
                  </p>
                ))}
              </div>
            )}
        </div>

        <EmailPasswordForm setResult={setResult} />

        <Passkey setResult={setResult} />
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 items-center py-4">
        <p className="text-sm text-foreground/50">
          Don't remember your password?{" "}
          <Link
            href="/forgot-password"
            className="text-primary dark:text-foreground hover:underline"
          >
            Reset password
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
