import Link from "next/link";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function PlaceholderContent({
  loading = false,
}: {
  loading?: boolean;
}) {
  return (
    <Card
      className={cn(
        "rounded-lg border-none mt-6",
        loading ? "animate-pulse" : ""
      )}
    >
      <CardContent className="p-6 relative">
        <div className="flex justify-center items-center min-h-[calc(100vh-56px-64px-20px-24px-56px-48px)]">
          <div className="flex flex-col relative">
            <img
              src="/images/placeholder.png"
              alt="Placeholder Image"
              width={500}
              height={500}
            />
          </div>
        </div>

        {loading && (
          <div className="absolute flex items-center gap-2 bottom-5 right-5">
            <Loader2 className="w-6 h-6 font-bold text-black animate-spin" />
            <span className="text-md text-black font-medium">Loading...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
