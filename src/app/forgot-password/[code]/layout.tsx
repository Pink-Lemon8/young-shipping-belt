import { Suspense } from "react";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { verification } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function ForgetPasswordAuthCheck({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (authentication && authentication.user) redirect("/dashboard");

  const code: string | undefined = (await params).code;
  if (!code) redirect("/forgot-password");

  const [userToken] = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, `reset-password:${code}`));

  if (!userToken) redirect("/forgot-password");

  const timeDifference =
    (userToken.expiresAt?.getTime() ?? 0) - new Date().getTime();

  if (timeDifference <= 0) redirect("/forgot-password");

  return <>{children}</>;
}

export default function ForgetPasswordLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: any;
}>) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ForgetPasswordAuthCheck params={params}>{children}</ForgetPasswordAuthCheck>
    </Suspense>
  );
}
