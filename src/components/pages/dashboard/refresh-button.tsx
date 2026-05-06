"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isPending || isRefreshing}
      className="border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 cursor-pointer"
    >
      <RefreshCw
        className={`h-4 w-4 mr-2 transition-transform ${isPending || isRefreshing ? "animate-spin" : ""}`}
      />
      <span className="font-medium">Refresh</span>
    </Button>
  );
}
