import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import GlobalProviders from "./global-providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

import { cn } from "@/lib/utils";
import { ProductionDevelopmentChecker } from "@/components/common/production-development-checker";
import { DeferredAnalytics } from "@/components/common/deferred-analytics";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_URL
      ? `${process.env.APP_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`
  ),
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon", sizes: "any" }],
  },
  title: "Young Shipping Belt",
  description: "Young Shipping Belt",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Young Shipping Belt",
    description: "Young Shipping Belt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Young Shipping Belt",
    description: "Young Shipping Belt",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          GeistSans.className,
          "selection:bg-primary selection:text-primary-foreground"
        )}
      >
        <GlobalProviders>
          {children}
          <DeferredAnalytics />
          <Toaster />
          <SonnerToaster
            position="top-center"
            duration={3000}
            visibleToasts={3}
            richColors
            swipeDirections={["top", "bottom", "left", "right"]}
          />
        </GlobalProviders>
        <ProductionDevelopmentChecker />
      </body>
    </html>
  );
}
