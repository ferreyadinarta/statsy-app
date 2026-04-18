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

export async function proxy(request: NextRequest) {
    const host = request.headers.get("host") ?? "";
    const { pathname } = request.nextUrl;

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
