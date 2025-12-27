"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateEventLabPayload, EventLabStatus } from "@/lib/eventLabs";
import { createEventLab, updateEventLab } from "@/lib/eventLabsClient";

interface LabFormProps {
  mode: "create" | "edit";
  initialData?: {
    slug: string;
    name: string;
    objective?: string;
    surfaces_to_observe?: string[];
    start_date: string;
    end_date?: string;
    status?: EventLabStatus;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LabForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: LabFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    objective: initialData?.objective || "",
    surfaces: initialData?.surfaces_to_observe?.join(", ") || "",
    startDate: initialData?.start_date?.split("T")[0] || "",
    endDate: initialData?.end_date?.split("T")[0] || "",
    slug: initialData?.slug || "",
    status: initialData?.status || "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateEventLabPayload = {
        name: formData.name.trim(),
        objective: formData.objective.trim() || undefined,
        surfaces_to_observe: formData.surfaces
          ? formData.surfaces
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        start_date: new Date(formData.startDate).toISOString(),
        end_date: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        slug: formData.slug.trim() || undefined,
      };

      if (mode === "create") {
        const lab = await createEventLab(payload);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/labs/${lab.slug}`);
        }
      } else if (initialData) {
        await updateEventLab(initialData.slug, {
          ...payload,
          status: formData.status as EventLabStatus,
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lab");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Lab Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., DenLabs Demo Day Q1"
          required
          minLength={3}
          maxLength={255}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
        <p className="text-xs text-white/60">
          A clear name for your event or demo
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective" className="text-white">
          Objective <span className="text-white/40">(Optional)</span>
        </Label>
        <Textarea
          id="objective"
          value={formData.objective}
          onChange={(e) =>
            setFormData({ ...formData, objective: e.target.value })
          }
          placeholder="e.g., Test onboarding flow for new users"
          rows={3}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
        />
        <p className="text-xs text-white/60">
          What are you trying to learn from this lab?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug" className="text-white">
          Slug <span className="text-white/40">(Optional)</span>
        </Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="Auto-generated from name"
          pattern="[a-z0-9-]+"
          maxLength={64}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
        <p className="text-xs text-white/60">
          Used in public link: denlabs.com/lab/
          {formData.slug || "your-slug"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="surfaces" className="text-white">
          Surfaces to Observe <span className="text-white/40">(Optional)</span>
        </Label>
        <Input
          id="surfaces"
          value={formData.surfaces}
          onChange={(e) =>
            setFormData({ ...formData, surfaces: e.target.value })
          }
          placeholder="e.g., /onboarding, /checkout, /dashboard"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
        <p className="text-xs text-white/60">
          Comma-separated list of routes or features to track
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-white">
            Start Date <span className="text-red-400">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            required
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-white">
            End Date <span className="text-white/40">(Optional)</span>
          </Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            min={formData.startDate}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      {mode === "edit" && (
        <div className="space-y-2">
          <Label htmlFor="status" className="text-white">
            Status
          </Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as EventLabStatus,
              })
            }
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-wolf-emerald text-black hover:bg-wolf-emerald/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : mode === "create" ? (
            "Create Lab"
          ) : (
            "Save Changes"
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
