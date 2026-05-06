import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Loader2 } from "lucide-react";

async function AuthRedirect() {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });

  if (authentication && authentication.user) {
    redirect("/dashboard");
  }
  redirect("/sign-in");
  return null;
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthRedirect />
    </Suspense>
  );
}
