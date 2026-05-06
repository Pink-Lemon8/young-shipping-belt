"use client";

import { ForgetPasswordForm } from "@/components/pages/forgot-password/form";
import { useState } from "react";
import { Result } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgetPasswordPage() {
  const [result, setResult] = useState<Result | undefined>(undefined);
  return (
    <div>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/images/bg.mp4" type="video/mp4" />
      </video>

      <div className="flex flex-col items-center p-4 max-w-xl mx-auto relative z-10">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mt-8">
          <Card className="w-full mx-auto bg-white/50 dark:bg-black/15 backdrop-blur-3xl rounded-xl shadow-md">
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
            </CardHeader>
            <CardContent>
              <ForgetPasswordForm setResult={setResult} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
