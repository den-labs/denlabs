import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * GET /api/a2a/capabilities
 *
 * Agent-to-Agent (A2A) capabilities discovery endpoint
 * Returns available capabilities and endpoints for agent interoperability
 *
 * MVP status: mvp-static (static capability list for demonstration)
 */
export async function GET() {
  // TODO: Make capabilities dynamic based on actual agent features
  // For MVP, return static capability list

  return NextResponse.json(
    {
      name: "DenLabs",
      version: "1.0.0",
      status: "mvp-static",
      capabilities: [
        "Event Feedback Labs",
        "Real-time Signal Capture",
        "Trust-Scored Feedback",
        "Retro Pack Generation (Markdown)",
        "Trust Verification (8004 scan)",
        "Premium Access Management (x402)",
        "Feedback Collection and Analysis",
        "Builder Profile Management",
        "Mission and Quest Tracking",
        "Bulk Payments (Spray)",
        "Engagement Rewards (GoodDollar)",
      ],
      endpoints: [
        {
          name: "Scan Trust Score",
          url: "/api/scan/8004",
          method: "GET",
        },
        {
          name: "x402 Demo",
          url: "/api/x402/demo",
          method: "GET",
        },
        {
          name: "Get Capabilities",
          url: "/api/a2a/capabilities",
          method: "GET",
        },
      ],
    },
    { status: 200 },
  );
}
