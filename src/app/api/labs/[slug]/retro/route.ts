import { type NextRequest, NextResponse } from "next/server";
import { exportRetroPackAsMarkdown, generateRetroPack } from "@/lib/retroPack";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// =====================================================
// GET /api/labs/:slug/retro - Generate retro pack
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  try {
    // Get lab ID from slug
    const { data: lab, error: labError } = await supabaseAdmin
      .from("event_labs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (labError || !lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Generate retro pack
    const retro = await generateRetroPack(lab.id);

    // Return format based on query param
    if (format === "markdown") {
      const markdown = exportRetroPackAsMarkdown(retro);
      return new NextResponse(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="retro-${slug}-${Date.now()}.md"`,
        },
      });
    }

    // Default: JSON
    return NextResponse.json({ retro });
  } catch (error) {
    console.error("Unexpected error generating retro pack", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
