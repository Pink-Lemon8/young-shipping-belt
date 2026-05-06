import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Export the API route handlers
export const { POST, GET } = toNextJsHandler(auth);
