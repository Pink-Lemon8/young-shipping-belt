import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/db";
import {
  user as DBUser,
  session as DBSession,
  account as DBAccount,
  verification as DBVerification,
  jwks as DBJwks,
  twoFactor as DBTwoFactor,
  passkey as DBPasskey,
  apikey as DBApiKey,
  user,
} from "@/db/schema";
import "dotenv/config";
import { nextCookies } from "better-auth/next-js";
import {
  jwt,
  admin,
  organization,
  multiSession,
  twoFactor,
  magicLink,
  emailOTP,
  apiKey,
  haveIBeenPwned,
} from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

import { userAc, userRoles } from "./roles-and-permissions";
import { eq } from "drizzle-orm";
import {
  sendMagicLinkEmail,
  sendOTPEmail,
  sendResetPasswordEmail,
  sendTwoFactorEnableEmail,
} from "@/server/email/sender";
import { extraFieldsForType } from "./extraFieldsForType";

export const auth = betterAuth({
  appName: process.env.APP_NAME,
  trustedOrigins: [
    "http://localhost:3000",
  ],
  baseURL: "https://parkwayshipping.ca",
  telemetry: { enabled: false },
  database: drizzleAdapter(db, {
    provider: "mysql",
    usePlural: false,
    schema: {
      user: DBUser,
      account: DBAccount,
      session: DBSession,
      verification: DBVerification,
      jwks: DBJwks,
      twoFactor: DBTwoFactor,
      passkey: DBPasskey,
      apikey: DBApiKey,
    },
  }),

  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    sendVerificationEmail: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendResetPasswordEmail({
        name: user.name,
        email: user.email,
        resetToken: token,
        expiryTime: "1 hour (60 minutes)",
      });
    },
  },

  session: {
    freshAge: 1 * 24 * 60 * 60,
    storeSessionInDatabase: true,
  },

  user: {
    additionalFields: {
      phoneNumber: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
      language: {
        type: "string",
        required: false,
        defaultValue: "en-US",
        input: true,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "UTC",
        input: true,
      },
      timeFormat: {
        type: "string",
        required: false,
        defaultValue: "dd MMM yyyy, hh:mm a",
        input: true,
      },
      bio: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
      department: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
      beltCode: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
      affiliates: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
    },
  },

  plugins: [
    jwt(),
    admin({
      defaultRole: "regular",
      ac: userAc,
      roles: userRoles,
      adminRoles: ["superAdmin"],
      impersonationSessionDuration: 60 * 60 * 24 * 7,
    }),
    multiSession({
      maximumSessions: 2,
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const [getUser] = await db
          .select()
          .from(user)
          .where(eq(user.email, email))
          .limit(1);

        if (type === "sign-in") {
          await sendOTPEmail({
            email: email,
            name: getUser?.name ?? email,
            otp: otp,
            expiryTime: "10 minutes",
          });
        }
      },
      expiresIn: 600,
    }),
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }, request) {
          await sendTwoFactorEnableEmail({
            email: user.email,
            name: user?.name ?? user.email,
            verificationCode: otp,
            expiryTime: "10 minutes",
            supportEmail: "support@parkwayshipping.ca",
            requestTime: new Date().toLocaleString(),
            ipAddress:
              request?.headers?.get("x-forwarded-for") ?? "Not available",
            deviceInfo:
              request?.headers?.get("sec-ch-ua-platform") ?? "Not available",
          });
        },
      },
      skipVerificationOnEnable: false,
    }),
    passkey({
      rpName: process.env.APP_NAME,
      rpID: process.env.BETTER_AUTH_DOMAIN,
      origin: process.env.BETTER_AUTH_URL?.split(",").map((origin) => origin.trim()),
    }),
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        const [getUser] = await db
          .select()
          .from(user)
          .where(eq(user.email, email))
          .limit(1);

        await sendMagicLinkEmail({
          email: email,
          name: getUser?.name ?? email,
          magicLink: url,
          expiryTime: "10 minutes",
        });
      },
      disableSignUp: true,
      expiresIn: 60 * 10,
    }),
    apiKey(),
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "Your password has been compromised in a data breach. Please use a different password.",
    }),
    extraFieldsForType,
    nextCookies(),
  ],
});
