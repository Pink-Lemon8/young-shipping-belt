import { Suspense } from "react";
import { UserNav } from "@/components/layout/user-nav";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (
    !["superAdmin", "admin"].includes(authentication?.user?.role ?? "regular")
  )
    redirect("/dashboard");

  return (
    <>
      {children}
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminAuthCheck>{children}</AdminAuthCheck>
    </Suspense>
  );
}
