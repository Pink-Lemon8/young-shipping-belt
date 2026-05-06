// components/auth/auth-form.tsx
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
import { SignupForm } from "./form";

export function SignupCard() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Sign up for Pinklemon8 INC Management System
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <SignupForm redirect="/sign-in" />
      </CardContent>
      <CardFooter className="flex justify-center py-4">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-blue-500 hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
