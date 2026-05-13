"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { NavManagement } from "./nav-management";
import { NavGlobal } from "./nav-global";
import { SidebarUser } from "./user";
import { adminItems, coordinatorItems, globalItems, managementItems } from "./list";
import { Label } from "@/components/ui/label";
import { ThemeSelector, ModeSwitcher } from "@/components/theme";
import { cn } from "@/lib/utils";
import { authClient, useSession } from "@/lib/auth/auth-client";
import { useEffect, useState } from "react";
import { BoxesIcon } from "lucide-react";

export function ManagementSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();
  const router = useRouter();
  const { data: authentication } = authClient.useSession();

  const [user, setUser] = useState<any | undefined>(undefined);

  useEffect(() => {
    if (authentication?.user) setUser(authentication.user);
  }, [authentication]);

  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => router.push("/dashboard")}
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Image
                src="/images/logo.png"
                alt="Young Shipping Belt"
                width={48}
                height={48}
              />
              <div>
                <Label className="text-lg font-bold leading-none text-[#d1a5cc] -mt-2">
                  Medical Clinic
                </Label>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGlobal
          items={[
            ...globalItems,
            ...(["superAdmin", "admin", "coordinator"].includes(
              authentication?.user?.role ?? "regular"
            )
              ? [
                ...coordinatorItems,
                ...(user?.beltCode
                  ? [
                    {
                      title: `Belt`,
                      url: "/belt",
                      icon: BoxesIcon,
                    },
                  ]
                  : []),
              ]
              : []),
          ]}
        />

        {["superAdmin", "admin"].includes(
          authentication?.user?.role ?? "regular"
        ) && (
            <>
              <NavManagement title="Management" items={managementItems} />
            </>
          )}
        {["superAdmin", "admin"].includes(
          authentication?.user?.role ?? "regular"
        ) && (
            <NavManagement title="Administration" items={adminItems} />
          )}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-row w-full items-center justify-center gap-2">
          <ThemeSelector className={cn(open ? "w-full" : "hidden")} />
          <ModeSwitcher />
        </div>
        <SidebarUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
