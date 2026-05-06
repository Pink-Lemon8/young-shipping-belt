import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { setAllUnlockedBeltUserInQueue } from "@/server/controller/queues";

export default async function LogoutPage() {
  const authentication = await auth.api.getSession({
    headers: await headers(),
  });
  if (!authentication || !authentication.user) return redirect("/sign-in");

  if (authentication.user.beltCode)
    await setAllUnlockedBeltUserInQueue(authentication.user.beltCode);

  await auth.api.signOut({
    headers: await headers(),
  });
  return redirect("/sign-in");
}
