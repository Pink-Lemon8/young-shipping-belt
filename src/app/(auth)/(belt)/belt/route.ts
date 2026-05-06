import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });

  const origin = new URL(request.url).origin;

  if (!authentication?.user) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }
  if (!authentication.user.beltCode) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return NextResponse.redirect(
    new URL(`/belt/${authentication.user.beltCode}`, origin),
  );
}
