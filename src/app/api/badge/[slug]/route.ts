import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Use service role so this works without a session (public endpoint)
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    const { slug } = await params;

    const supabase = getServiceClient();

    const { data: page, error: pageError } = await supabase
        .from("status_pages")
        .select("id, name, slug")
        .eq("slug", slug)
        .single();

    if (pageError || !page) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: services } = await supabase
        .from("services")
        .select("status")
        .eq("status_page_id", page.id);

    // Derive overall status
    let status: "operational" | "degraded" | "outage" = "operational";
    if (services && services.some((s) => s.status === "outage")) {
        status = "outage";
    } else if (services && services.some((s) => s.status === "degraded")) {
        status = "degraded";
    }

    const labelMap = {
        operational: "All systems operational",
        degraded: "Degraded performance",
        outage: "Service outage",
    };

    const response = NextResponse.json({
        slug: page.slug,
        name: page.name,
        status,
        label: labelMap[status],
    });

    // CORS — allow any origin to fetch this (badge lives on external sites)
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    // Cache for 60 seconds at the edge — fast but near-live
    response.headers.set(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=30",
    );

    return response;
}

// Handle OPTIONS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
    });
}
