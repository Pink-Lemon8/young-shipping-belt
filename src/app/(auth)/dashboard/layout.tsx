import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/management/sidebar/navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ManagementSidebar } from "@/components/layout/management/sidebar/app-sidebar";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function DashboardAuthCheck({ children }: { children: React.ReactNode }) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (authentication?.user?.role === "pharmacist")
    redirect("/pharmacist-review");
  if (authentication?.user?.role === "belt") {
    if (authentication.user?.beltCode)
      redirect(`/belt/${authentication.user.beltCode}`);
  }

  return <>{children}</>;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ManagementSidebar collapsible="icon" variant="inset" />
      <SidebarInset>
        <Navbar title="Dashboard" />
        <Suspense fallback={<LoadingFallback />}>
          <DashboardAuthCheck>{children}</DashboardAuthCheck>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
