import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API_ROUTES = ["/api/subscribe", "/api/public-status/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicApi = PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r));

  if (!isPublicApi) return NextResponse.next();

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export const config = {
  matcher: ["/api/subscribe", "/api/public-status/:path*"],
};
