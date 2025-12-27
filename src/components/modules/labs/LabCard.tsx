import { Calendar, FlaskConical, Target } from "lucide-react";
import Link from "next/link";
import type { EventLab } from "@/lib/eventLabs";

interface LabCardProps {
  lab: EventLab;
}

export function LabCard({ lab }: LabCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "paused":
        return {
          label: "Paused",
          className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        };
      case "completed":
        return {
          label: "Completed",
          className: "bg-white/10 text-white/60 border-white/20",
        };
      default:
        return {
          label: status,
          className: "bg-white/5 text-white/40 border-white/10",
        };
    }
  };

  const statusConfig = getStatusConfig(lab.status);
  const isOngoing = !lab.end_date || new Date(lab.end_date) > new Date();

  return (
    <Link
      href={`/labs/${lab.slug}`}
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-semibold text-white group-hover:text-wolf-emerald transition-colors">
              {lab.name}
            </h3>
            {lab.objective && (
              <p className="text-sm text-white/70 line-clamp-2">
                {lab.objective}
              </p>
            )}
          </div>
          <div
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.className}`}
          >
            {statusConfig.label}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{formatDate(lab.start_date)}</span>
            {lab.end_date && (
              <>
                <span>→</span>
                <span>{formatDate(lab.end_date)}</span>
              </>
            )}
            {isOngoing && !lab.end_date && (
              <span className="text-emerald-400">(Ongoing)</span>
            )}
          </div>
        </div>

        {/* Surfaces */}
        {lab.surfaces_to_observe && lab.surfaces_to_observe.length > 0 && (
          <div className="flex items-start gap-2">
            <Target
              className="h-4 w-4 text-white/40 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="flex flex-wrap gap-1.5">
              {lab.surfaces_to_observe.slice(0, 3).map((surface, index) => (
                <span
                  key={index}
                  className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/70"
                >
                  {surface}
                </span>
              ))}
              {lab.surfaces_to_observe.length > 3 && (
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/50">
                  +{lab.surfaces_to_observe.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            <span>/{lab.slug}</span>
          </div>
          <span className="text-sm font-medium text-wolf-emerald group-hover:underline">
            View Lab →
          </span>
        </div>
      </div>
    </Link>
  );
}
