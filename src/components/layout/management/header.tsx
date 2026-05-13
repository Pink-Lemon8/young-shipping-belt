"use client";

import { Package } from "lucide-react";
import { UserNav } from "../user-nav";
import Link from "next/link";

export default function ManagementHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80 rounded-t-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/80 shadow-lg">
            <Package className="h-6 w-6 text-background dark:text-foreground" />
          </div>
          <div>
            <Link href="/dashboard">
              <h1 className="text-base sm:text-xl font-bold text-foreground">
                Young Shipping Belt
              </h1>
            </Link>
            <p className="text-xs text-muted-foreground">
              Operations Dashboard
            </p>
          </div>
        </div>
        <div className="max-w-[230px]">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
