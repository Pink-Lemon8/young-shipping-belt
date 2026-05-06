import { Suspense } from "react";
import { UserNav } from "@/components/layout/user-nav";
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

async function CoordinatorAuthCheck({ children }: { children: React.ReactNode }) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (
    !["superAdmin", "admin", "coordinator"].includes(
      authentication?.user?.role ?? "regular"
    )
  )
    redirect("/dashboard");

  return (
    <>
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 border-2 bg-white/50 backdrop-blur-sm p-1 rounded-full z-50">
        <UserNav />
      </div>
      {children}
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CoordinatorAuthCheck>{children}</CoordinatorAuthCheck>
    </Suspense>
  );
}
