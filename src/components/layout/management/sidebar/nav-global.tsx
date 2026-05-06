"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Item } from "./list";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export function NavGlobal({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const { isMobile, toggleSidebar } = useSidebar();
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:show">
      <SidebarMenu>
        {items.map((item, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton asChild isActive={pathname.includes(item.url)}>
              <Link
                href={item.url}
                title={item.title}
                onClick={() => isMobile && toggleSidebar()}
              >
                {item.icon && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <item.icon />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        align="center"
                        sideOffset={15}
                        className="font-bold"
                      >
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <span className="truncate">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
