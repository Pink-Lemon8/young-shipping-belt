"use client";

import {
  ChevronsUpDown,
  LayoutGrid,
  LogOut,
  Settings,
  User,
  UserCog,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";
import { authClient, useSession } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileShowImage } from "@/components/entity/file/show/image";
import { useEffect, useState } from "react";
import { File } from "@/components/entity/file/type";
import { ThemeSelector } from "../theme/theme-selector";
import { ModeSwitcher } from "../theme/mode-switch";

export function UserNav() {
  const { data: sessionData } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    if (sessionData?.user?.image) {
      setFile({ id: Number(sessionData?.user?.image) });
    }
  }, [sessionData?.user?.image]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer flex flex-row items-center transition-all duration-300 border-2 bg-background backdrop-blur-sm p-1 rounded-full">
        {sessionData?.user && !sessionData?.user?.image && (
          <Avatar className={cn("rounded-full size-8")}>
            <AvatarImage
              src={`https://api.dicebear.com/6.x/initials/svg?seed=${
                sessionData?.user?.name?.charAt(0).toUpperCase() +
                sessionData?.user?.name?.charAt(1).toUpperCase()
              }`}
            />
            <AvatarFallback>--</AvatarFallback>
          </Avatar>
        )}
        {sessionData?.user && sessionData?.user?.image && (
          <FileShowImage
            file={file}
            setFile={setFile}
            width={128}
            height={128}
            className={cn("size-8 rounded-full")}
          />
        )}

        {/* <div className={cn("grid flex-1 text-left text-sm leading-tight")}>
          <span className="flex flex-row justify-between truncate font-semibold">
            {sessionData?.user?.name}
            {sessionData?.session?.impersonatedBy && (
              <UserCog className="w-5 h-5" />
            )}
          </span>
          <span className="truncate text-xs">{sessionData?.user?.email}</span>
        </div>
        <ChevronsUpDown className={cn("ml-auto size-4")} /> */}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        {sessionData?.session?.impersonatedBy && (
          <>
            <DropdownMenuLabel className="p-2">
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                onClick={async () => {
                  const res = await authClient.admin.stopImpersonating();
                  if (!res.error) {
                    toast.success("Impersonation stopped", {
                      description: "You are no longer impersonating anyone",
                    });
                    window.location.href = "/dashboard";
                  } else
                    toast.error("Error stopping impersonation", {
                      description:
                        res?.error?.message ??
                        "You are not impersonating anyone",
                    });
                }}
              >
                <LogOut className="w-4 h-4 ml-2" /> Stop Impersonation
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            {sessionData?.user && !sessionData?.user?.image && (
              <Avatar className={cn("rounded-full size-8")}>
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${
                    sessionData?.user?.name?.charAt(0).toUpperCase() +
                    sessionData?.user?.name?.charAt(1).toUpperCase()
                  }`}
                />
                <AvatarFallback>--</AvatarFallback>
              </Avatar>
            )}
            {sessionData?.user && sessionData?.user?.image && (
              <FileShowImage
                file={file}
                width={128}
                height={128}
                className="size-8 rounded-full"
              />
            )}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {sessionData?.user?.name}
              </span>
              <span className="truncate text-xs">
                {sessionData?.user?.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/dashboard" className="flex items-center">
              <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/account" className="flex items-center">
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <div className="flex flex-row w-full items-center justify-center gap-2">
              <ThemeSelector />
              <ModeSwitcher />
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={() => {
            window.location.href = "/sign-out";
            router.push("/sign-out");
          }}
        >
          <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
