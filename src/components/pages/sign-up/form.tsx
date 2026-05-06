// components/auth/auth-form.tsx
"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { register } from "./action";
import { Result } from "@/lib/types";
import { Loader2 } from "lucide-react";

type SignupFormProps = {
  redirect?: string;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};

export function SignupForm({ setResult, redirect }: SignupFormProps) {
  const [result, dispatch] = useActionState<Result | undefined, FormData>(
    register,
    undefined
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (setResult !== undefined) {
      setResult(result);
    } else {
      if (result?.status === "success") {
        if (redirect) {
          router.push(redirect);
        } else {
          window.location.reload();
          router.refresh();
        }
      }
      setLoading(false);
    }
    console.log(result);
  }, [result, router, setResult]);

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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            name="name"
          />
          {result?.errors?.find((error) => error.field === "name") && (
            <p className="text-sm text-red-500">
              {result.errors.find((error) => error.field === "name")?.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            name="email"
          />
          {result?.errors?.find((error) => error.field === "email") && (
            <p className="text-sm text-red-500">
              {result.errors.find((error) => error.field === "email")?.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            name="password"
          />
          {result?.errors?.find((error) => error.field === "password") && (
            <p className="text-sm text-red-500">
              {
                result.errors.find((error) => error.field === "password")
                  ?.message
              }
            </p>
          )}
        </div>
        {result?.messages &&
          result.messages.map((message, index) => (
            <p key={index} className="text-sm text-red-500">
              {message}
            </p>
          ))}
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || loading}
        >
          {isPending || loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Sign Up"
          )}
        </Button>
      </form>
    </>
  );
}
