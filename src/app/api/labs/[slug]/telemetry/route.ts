/**
 * Telemetry API
 * GET /api/labs/:slug/telemetry - Get aggregated telemetry data
 */

import { NextResponse } from "next/server";
import type { TelemetryData } from "@/lib/eventLabs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface RouteParams {
	params: Promise<{
		slug: string;
	}>;
}

/**
 * GET /api/labs/:slug/telemetry
 * Returns aggregated telemetry metrics for dashboard
 */
export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { slug } = await params;

		// Verify lab exists
		const { data: lab, error: labError } = await supabaseAdmin
			.from("event_labs")
			.select("id")
			.eq("slug", slug)
			.single();

		if (labError || !lab) {
			return NextResponse.json({ error: "Lab not found" }, { status: 404 });
		}

		const labId = lab.id;

		// Run all queries in parallel for performance
		const [
			participationResult,
			qualityResult,
			funnelsResult,
			opsResult,
		] = await Promise.all([
			getParticipationMetrics(labId),
			getQualityMetrics(labId),
			getFunnelMetrics(labId),
			getOpsMetrics(labId),
		]);

		const telemetry: TelemetryData = {
			participation: participationResult,
			quality: qualityResult,
			funnels: funnelsResult,
			ops: opsResult,
		};

		return NextResponse.json({ telemetry });
	} catch (err) {
		console.error("[Telemetry API] Error fetching telemetry:", err);
		return NextResponse.json(
			{ error: "Failed to fetch telemetry" },
			{ status: 500 },
		);
	}
}

// =====================================================
// AGGREGATION FUNCTIONS
// =====================================================

async function getParticipationMetrics(labId: string) {
	// Sessions total and last 24h
	const { data: sessionStats } = await supabaseAdmin
		.from("lab_sessions")
		.select("id, first_seen")
		.eq("lab_id", labId);

	const sessions_total = sessionStats?.length || 0;
	const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
	const sessions_last_24h =
		sessionStats?.filter((s) => s.first_seen >= cutoff24h).length || 0;

	// Feedback total
	const { count: feedback_total } = await supabaseAdmin
		.from("feedback_items")
		.select("*", { count: "exact", head: true })
		.eq("lab_id", labId);

	// Feedback per session average
	const feedback_per_session_avg =
		sessions_total > 0
			? Number.parseFloat(((feedback_total || 0) / sessions_total).toFixed(2))
			: 0;

	return {
		sessions_total,
		sessions_last_24h,
		feedback_total: feedback_total || 0,
		feedback_per_session_avg,
	};
}

async function getQualityMetrics(labId: string) {
	// Trust score distribution
	const { data: feedbackItems } = await supabaseAdmin
		.from("feedback_items")
		.select("trust_score, is_self_verified, status")
		.eq("lab_id", labId);

	const total = feedbackItems?.length || 0;

	if (total === 0) {
		return {
			trust_distribution: { trusted: 0, unverified: 0, risk: 0 },
			self_verified_percent: 0,
			spam_rate: 0,
		};
	}

	// Trust distribution
	const trusted = feedbackItems?.filter((f) => f.trust_score >= 80).length || 0;
	const unverified =
		feedbackItems?.filter(
			(f) => f.trust_score >= 40 && f.trust_score < 80,
		).length || 0;
	const risk = feedbackItems?.filter((f) => f.trust_score < 40).length || 0;

	// Self-verified percentage
	const selfVerifiedCount =
		feedbackItems?.filter((f) => f.is_self_verified).length || 0;
	const self_verified_percent = Number.parseFloat(
		((selfVerifiedCount / total) * 100).toFixed(1),
	);

	// Spam rate
	const spamCount =
		feedbackItems?.filter((f) => f.status === "spam").length || 0;
	const spam_rate = Number.parseFloat(((spamCount / total) * 100).toFixed(1));

	return {
		trust_distribution: { trusted, unverified, risk },
		self_verified_percent,
		spam_rate,
	};
}

async function getFunnelMetrics(labId: string) {
	// Top routes by page views
	const { data: pageViews } = await supabaseAdmin
		.from("event_tracking")
		.select("route")
		.eq("lab_id", labId)
		.eq("event_type", "page_view");

	const routeCounts: Record<string, number> = {};
	for (const pv of pageViews || []) {
		if (pv.route) {
			routeCounts[pv.route] = (routeCounts[pv.route] || 0) + 1;
		}
	}

	const top_routes = Object.entries(routeCounts)
		.map(([route, page_views]) => ({ route, page_views }))
		.sort((a, b) => b.page_views - a.page_views)
		.slice(0, 5);

	// Top routes with errors
	const { data: errors } = await supabaseAdmin
		.from("event_tracking")
		.select("route")
		.eq("lab_id", labId)
		.eq("event_type", "error_flag");

	const errorCounts: Record<string, number> = {};
	for (const err of errors || []) {
		if (err.route) {
			errorCounts[err.route] = (errorCounts[err.route] || 0) + 1;
		}
	}

	const top_errors = Object.entries(errorCounts)
		.map(([route, error_count]) => ({ route, error_count }))
		.sort((a, b) => b.error_count - a.error_count)
		.slice(0, 5);

	// Surface breakdown (observed vs other)
	// Note: This requires metadata to include is_observed_surface field
	const { data: allEvents } = await supabaseAdmin
		.from("event_tracking")
		.select("metadata")
		.eq("lab_id", labId);

	let observed = 0;
	let other = 0;

	for (const event of allEvents || []) {
		const metadata = event.metadata as Record<string, unknown> | null;
		if (metadata?.is_observed_surface === true) {
			observed++;
		} else if (metadata?.is_observed_surface === false) {
			other++;
		}
	}

	return {
		top_routes,
		top_errors,
		surface_breakdown: { observed, other },
	};
}

async function getOpsMetrics(labId: string) {
	// P0/P1 counts and open items
	const { data: feedbackItems } = await supabaseAdmin
		.from("feedback_items")
		.select("priority, status, tags")
		.eq("lab_id", labId);

	const p0_count =
		feedbackItems?.filter((f) => f.priority === "P0").length || 0;
	const p1_count =
		feedbackItems?.filter((f) => f.priority === "P1").length || 0;
	const open_count =
		feedbackItems?.filter((f) => f.status === "new" || f.status === "triaged")
			.length || 0;

	// Top tags
	const tagCounts: Record<string, number> = {};
	for (const item of feedbackItems || []) {
		if (Array.isArray(item.tags)) {
			for (const tag of item.tags) {
				tagCounts[tag] = (tagCounts[tag] || 0) + 1;
			}
		}
	}

	const top_tags = Object.entries(tagCounts)
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	return {
		p0_count,
		p1_count,
		open_count,
		top_tags,
	};
}
