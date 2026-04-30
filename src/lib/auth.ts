import { headers } from "next/headers";
import type { NextRequest } from "next/server";

// For server components / pages — reads user injected by middleware
export async function getUserFromHeaders(): Promise<{ id: string; email: string } | null> {
  const h = await headers();
  const id = h.get("x-user-id");
  if (!id) return null;
  return { id, email: h.get("x-user-email") ?? "" };
}

// For API route handlers — reads from the request object directly
export function getUserFromRequest(request: NextRequest): { id: string; email: string } | null {
  const id = request.headers.get("x-user-id");
  if (!id) return null;
  return { id, email: request.headers.get("x-user-email") ?? "" };
}
