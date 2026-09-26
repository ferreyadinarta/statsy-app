import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

function isStatsyHost(host: string): boolean {
    return (
        host === "statsy-app.vercel.app" ||
        host.endsWith(".statsy.page") ||
        host === "statsy.page" ||
        host.startsWith("localhost") ||
        host.startsWith("127.0.0.1")
    );
}

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
};

const PUBLIC_API_ROUTES = ["/api/subscribe", "/api/public-status/"];

// Pages that live on the static landing site but are linked relatively from it.
const LANDING_PATHS = ["/terms", "/demo", "/demo.html"];

export async function proxy(request: NextRequest) {
    const host = request.headers.get("host") ?? "";
    const { pathname } = request.nextUrl;

    // ── CORS for public API routes ────────────────────────────────────────────
    const isPublicApi = PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r));
    if (isPublicApi) {
        if (request.method === "OPTIONS") {
            return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
        }
        const res = NextResponse.next();
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
        return res;
    }

    // ── Wildcard subdomain routing ────────────────────────────────────────────
    if (host.endsWith(".statsy.page") && host !== "www.statsy.page") {
        const slug = host.replace(".statsy.page", "");
        const url = request.nextUrl.clone();
        url.pathname = `/${slug}${pathname === "/" ? "" : pathname}`;
        return NextResponse.rewrite(url);
    }

    // ── Custom domain routing ─────────────────────────────────────────────────
    if (!isStatsyHost(host)) {
        const supabase = getServiceClient();
        const { data: page } = await supabase
            .from("status_pages")
            .select("slug")
            .eq("custom_domain", host)
            .single();

        if (page?.slug) {
            const url = request.nextUrl.clone();
            url.pathname = `/${page.slug}`;
            return NextResponse.rewrite(url);
        }

        return new NextResponse("Not found", { status: 404 });
    }

    // ── Landing subpages, served from the landing site ────────────────────────
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL;
    if (landingUrl && LANDING_PATHS.includes(pathname)) {
        return NextResponse.rewrite(new URL(pathname.replace(/\.html$/, ""), landingUrl));
    }

    // ── Normal Statsy routing — auth check + header injection ─────────────────
    // Strip any client-supplied user headers to prevent spoofing
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("x-user-id");
    requestHeaders.delete("x-user-email");

    const setCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    setCookies.push(...(cookiesToSet as typeof setCookies));
                },
            },
        },
    );

    // Single auth network call per request
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        requestHeaders.set("x-user-id", user.id);
        requestHeaders.set("x-user-email", user.email ?? "");
    }

    // Auth redirects
    if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/billing"))) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (user && (pathname === "/login" || pathname === "/signup")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    // Serve the landing page at statsy.page itself (rewrite, not redirect) so
    // search engines index the root domain the landing's canonical points to.
    if (!user && pathname === "/") {
        const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL;
        if (landingUrl) return NextResponse.rewrite(new URL("/", landingUrl));
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (user && pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    setCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]),
    );

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
