"use client";

import { UserNav } from "./user-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <main className="min-h-screen bg-background">
      {children}
    </main>
  );
}
