"use client";

import type { ReactNode } from "react";
import { CheckCheck, PackageCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const orderedBadgeClass =
  "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-linear-to-r from-emerald-500/15 to-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-500/10 dark:text-emerald-300";

const receivedBadgeClass =
  "inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-linear-to-r from-sky-500/15 to-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-800 shadow-sm ring-1 ring-sky-500/10 dark:text-sky-300";

function withTooltip(node: ReactNode, content: string) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function OrderedMetadataBadge({
  tooltip,
}: {
  /** When set, badge is wrapped with a tooltip (e.g. process list rows). */
  tooltip?: string;
}) {
  const badge = (
    <span className={orderedBadgeClass}>
      <CheckCheck className="h-3.5 w-3.5" />
      Ordered
    </span>
  );
  return tooltip ? withTooltip(badge, tooltip) : badge;
}

export function ReceivedMetadataBadge({
  tooltip,
}: {
  tooltip?: string;
}) {
  const badge = (
    <span className={receivedBadgeClass}>
      <PackageCheck className="h-3.5 w-3.5" />
      Received
    </span>
  );
  return tooltip ? withTooltip(badge, tooltip) : badge;
}
