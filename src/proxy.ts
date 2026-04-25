import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Service role client for custom domain lookups — no user session needed
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

// Hosts that belong to Statsy itself — not custom domains
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

export async function proxy(request: NextRequest) {
    const host = request.headers.get("host") ?? "";
    const { pathname } = request.nextUrl;

    // ── CORS for public API routes ─────────────────────────────────────────────
    const isPublicApi = PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r));
    if (isPublicApi) {
        if (request.method === "OPTIONS") {
            return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
        }
        const res = NextResponse.next();
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
        return res;
    }

    // ── Wildcard subdomain routing ─────────────────────────────────────────────
    if (host.endsWith(".statsy.page") && host !== "www.statsy.page") {
        const slug = host.replace(".statsy.page", "");
        const url = request.nextUrl.clone();
        url.pathname = `/${slug}${pathname === "/" ? "" : pathname}`;
        return NextResponse.rewrite(url);
    }

    // ── Custom domain routing ──────────────────────────────────────────────────
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

        // Custom domain not found — show 404
        return new NextResponse("Not found", { status: 404 });
    }

    // ── Normal Statsy routing ──────────────────────────────────────────────────
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    // Refresh session — do not add logic before this
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Not logged in + trying to access dashboard → send to login
    if (!user && pathname.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Logged in + visiting login or signup → send to dashboard
    if (user && (pathname === "/login" || pathname === "/signup")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
