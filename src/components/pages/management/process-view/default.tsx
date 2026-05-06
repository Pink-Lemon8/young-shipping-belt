"use client";
import { useState } from "react";

export default function ProcessViewDefault({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="relative">
      <div className="relative pt-8 mb-8">{children}</div>
    </section>
  );
}
