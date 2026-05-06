import { createAuthClient } from "better-auth/react";
import { nextCookies } from "better-auth/next-js";
import {
  adminClient,
  apiKeyClient,
  emailOTPClient,
  inferAdditionalFields,
  magicLinkClient,
  multiSessionClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import type { auth } from ".";
import { passkeyClient } from "@better-auth/passkey/client";

// Create and export the client hooks
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  plugins: [
    adminClient(),
    organizationClient(),
    multiSessionClient(),
    passkeyClient(),
    twoFactorClient(),
    magicLinkClient(),
    emailOTPClient(),
    apiKeyClient(),
    inferAdditionalFields<typeof auth>(),
    nextCookies(),
  ],
});

export const { signIn, signOut, useSession } = authClient;
