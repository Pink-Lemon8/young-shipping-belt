import { Suspense } from "react";
import { UserNav } from "@/components/layout/user-nav-ball";
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

async function PharmacistAuthCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (authentication?.user?.role !== "pharmacist") redirect("/dashboard");

  return (
    <>
      <div className="absolute top-8 right-8 w-fit bg-white/50 backdrop-blur-sm rounded-full z-50">
        <UserNav />
      </div>
      {children}
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PharmacistAuthCheck>{children}</PharmacistAuthCheck>
    </Suspense>
  );
}
