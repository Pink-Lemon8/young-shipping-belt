import { Suspense } from "react";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Young Shipping Belt - Forgot Password",
  description: "Young Shipping Belt",
};

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function ForgotPasswordAuthCheck({ children }: { children: React.ReactNode }) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (authentication && authentication.user) redirect("/dashboard");

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ForgotPasswordAuthCheck>{children}</ForgotPasswordAuthCheck>
    </Suspense>
  );
}
