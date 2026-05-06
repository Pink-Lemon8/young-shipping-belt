import { xmcpHandler } from "@xmcp/adapter";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { apikey } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function validateApiKey(request: NextRequest): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  if (!authorization) return false;

  const [type, token] = authorization.split(" ");
  if (type !== "Bearer" || !token) return false;

  const hashedKey = hashApiKey(token);

  const [key] = await db
    .select()
    .from(apikey)
    .where(eq(apikey.key, hashedKey))
    .limit(1);

  if (!key || !key.enabled) return false;

  const metadata = key.metadata ? JSON.parse(key.metadata as string) : {};
  if (metadata.purpose !== "mcp-server") return false;

  return true;
}

async function authHandler(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const isValid = await validateApiKey(request);

  if (!isValid) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized: Invalid or missing API key" },
        id: null,
      },
      { status: 401 }
    );
  }

  return handler(request);
}

export async function GET(request: NextRequest) {
  return authHandler(request, xmcpHandler as any);
}

export async function POST(request: NextRequest) {
  return authHandler(request, xmcpHandler as any);
}
