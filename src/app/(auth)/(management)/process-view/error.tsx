"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ProcessViewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Process view error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Process View Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Something went wrong while loading the process view.
          </p>
          {error.digest && (
            <p className="mb-4 text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={reset} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/dashboard">
              <Button className="gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
