"use client";
import { SignInCard } from "@/components/pages/sign-in/card";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-start px-10 relative overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/images/bg.mp4" type="video/mp4" />
      </video>

      <div className="w-full max-w-md relative z-10">
        <SignInCard className="my-first-step bg-white/50 dark:bg-white/10 backdrop-blur-3xl rounded-xl shadow-md" />
      </div>
    </div>
  );
}
