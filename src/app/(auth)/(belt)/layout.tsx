import { Suspense } from "react";
import { UserNav } from "@/components/layout/user-nav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function BeltAuthCheck({ children }: { children: React.ReactNode }) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (
    !["superAdmin", "admin", "coordinator", "belt"].includes(
      authentication?.user?.role ?? "regular",
    )
  )
    redirect("/dashboard");

  if (!authentication?.user?.beltCode) redirect("/dashboard");

  return (
    <>
      <div className="flex justify-center mt-5 mx-auto relative lg:absolute lg:top-6 lg:right-8 lg:mt-0 border-2 w-fit bg-white/50 backdrop-blur-sm p-1 rounded-full z-50">
        <UserNav />
      </div>
      {children}
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BeltAuthCheck>{children}</BeltAuthCheck>
    </Suspense>
  );
}
