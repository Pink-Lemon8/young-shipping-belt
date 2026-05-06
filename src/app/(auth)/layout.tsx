import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { headers } from "next/headers";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function AuthCheck({ children }: { children: React.ReactNode }) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });

  if (authentication && authentication.user) {
    return <MainLayout>{children}</MainLayout>;
  }
  redirect("/sign-in");
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCheck>{children}</AuthCheck>
    </Suspense>
  );
}
