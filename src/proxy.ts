import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (
    authentication &&
    ["pharmacy", "labelHelper", "csr", "regular"].includes(
      authentication.user?.role ?? "regular"
    ) &&
    request.nextUrl.pathname !== "/sign-out"
  ) {
    return NextResponse.redirect(new URL("/sign-out", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
