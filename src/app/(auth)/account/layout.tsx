"use server";
import { UserNav } from "@/components/layout/user-nav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ManagementNav from "@/components/layout/management/nav";
import { headers } from "next/headers";
import ManagementHeader from "@/components/layout/management/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ManagementSidebar } from "@/components/layout/management/sidebar/app-sidebar";
import { Navbar } from "@/components/layout/management/sidebar/navbar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (
    ["superAdmin", "admin", "coordinator"].includes(
      authentication?.user?.role ?? "regular"
    )
  )
    return (
      <>
        <SidebarProvider>
          <ManagementSidebar collapsible="icon" variant="inset" />
          <SidebarInset>
            <Navbar title="Account" />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </>
    );

  return (
    <>
      <ManagementHeader />
      <div className="container max-w-7xl mx-auto my-10">{children}</div>
    </>
  );
}
