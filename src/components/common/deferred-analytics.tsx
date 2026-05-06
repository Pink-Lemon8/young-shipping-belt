"use client";

import dynamic from "next/dynamic";

// Defer non-critical third-party libraries - load after hydration (Rule 2.3)
const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((m) => m.Analytics),
  { ssr: false }
);
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false }
);

export function DeferredAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
