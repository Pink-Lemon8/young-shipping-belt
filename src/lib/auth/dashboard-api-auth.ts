import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Same rules as `src/app/(auth)/dashboard/layout.tsx` (DashboardAuthCheck):
 * must be signed in; pharmacist and belt users cannot use dashboard APIs.
 * Returns a NextResponse to return from the route, or null if OK.
 */
export async function assertDashboardApiAccess(): Promise<NextResponse | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role === "pharmacist" || role === "belt") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
