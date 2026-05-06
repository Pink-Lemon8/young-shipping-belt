import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function SignInAuthCheck({ children }: { children: React.ReactNode }) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });

  if (authentication && authentication.user) redirect("/dashboard");

  return <>{children}</>;
}

export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignInAuthCheck>{children}</SignInAuthCheck>
    </Suspense>
  );
}
