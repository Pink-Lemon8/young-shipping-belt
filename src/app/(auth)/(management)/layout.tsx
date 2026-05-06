import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ManagementHeader from "@/components/layout/management/header";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { ManagementSidebar } from "@/components/layout/management/sidebar/app-sidebar";

function LoadingFallback() {
  return (
    <SidebarProvider>
      <ManagementSidebar collapsible="icon" variant="inset" />
      <SidebarInset>
        <main className="bg-gray-50 dark:bg-gray-950 rounded-b-xl">
          <div className="flex min-h-screen items-center rounded-xl justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function ManagementAuthCheck({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <SidebarProvider>
        <ManagementSidebar collapsible="icon" variant="inset" />
        <SidebarInset>
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ManagementAuthCheck>{children}</ManagementAuthCheck>
    </Suspense>
  );
}
