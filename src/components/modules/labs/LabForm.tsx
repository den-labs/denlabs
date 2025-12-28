"use client";

import {
  CheckCircle2,
  FlaskConical,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateEventLabPayload, EventLabStatus } from "@/lib/eventLabs";
import { createEventLab, updateEventLab } from "@/lib/eventLabsClient";

// Observable routes in DenLabs
const OBSERVABLE_ROUTES = [
  "/access",
  "/auth",
  "/profile",
  "/onboarding",
  "/welcome",
  "/profile-setup",
  "/spray",
  "/transactions",
  "/confirmation",
  "/checkout",
  "/dashboard",
  "/labs",
  "/labs/create",
  "/scan-8004",
  "/x402",
  "/a2a",
  "/gooddollar",
  "/taberna",
  "/mentorship",
  "/checkin",
  "/voting",
  "/showcase",
  "/mind-games",
  "/missions",
  "/quests",
  "/leaderboard",
  "/stats",
  "/settings",
];

interface LabTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof FlaskConical;
  objective: string;
  surfaces: string[];
}

const LAB_TEMPLATES: LabTemplate[] = [
  {
    id: "onboarding",
    name: "Onboarding Audit",
    description: "Test user onboarding flow and identify friction points",
    icon: UserCheck,
    objective: "Test user onboarding flow and identify friction points",
    surfaces: ["/onboarding", "/welcome", "/profile-setup"],
  },
  {
    id: "wallet-connect",
    name: "Wallet Connect Audit",
    description: "Audit wallet connection and trust verification flow",
    icon: ShieldCheck,
    objective: "Audit wallet connection experience and trust verification flow",
    surfaces: ["/access", "/auth", "/profile"],
  },
  {
    id: "spray-flow",
    name: "Spray Flow Audit",
    description: "Test bulk reward distribution and transaction flow",
    icon: Sparkles,
    objective: "Test bulk reward distribution and transaction flow",
    surfaces: ["/spray", "/transactions", "/confirmation"],
  },
  {
    id: "general-event",
    name: "General Event Lab",
    description: "Collect general feedback from event participants",
    icon: FlaskConical,
    objective: "Collect general feedback from event participants",
    surfaces: [],
  },
];

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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    objective: initialData?.objective || "",
    surfaces: initialData?.surfaces_to_observe || [],
    startDate: initialData?.start_date?.split("T")[0] || getTodayDate(),
    endDate: initialData?.end_date?.split("T")[0] || "",
    slug: initialData?.slug || "",
    status: initialData?.status || "active",
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = LAB_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData((prev) => ({
        ...prev,
        objective: template.objective,
        surfaces: template.surfaces,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateEventLabPayload = {
        name: formData.name.trim(),
        objective: formData.objective.trim() || undefined,
        surfaces_to_observe:
          formData.surfaces.length > 0 ? formData.surfaces : undefined,
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

      {/* Template Selector (only in create mode) */}
      {mode === "create" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white text-sm font-semibold">
              Start with a Template{" "}
              <span className="text-white/40 font-normal">(Optional)</span>
            </Label>
            {selectedTemplate && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplate(null);
                  setFormData((prev) => ({
                    ...prev,
                    objective: "",
                    surfaces: [],
                  }));
                }}
                className="text-xs text-wolf-emerald hover:text-wolf-emerald/80"
              >
                Clear template
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {LAB_TEMPLATES.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`group relative rounded-lg border p-4 text-left transition ${
                    isSelected
                      ? "border-wolf-emerald/50 bg-wolf-emerald/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                        isSelected
                          ? "border-wolf-emerald/30 bg-wolf-emerald/20"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isSelected ? "text-wolf-emerald" : "text-white/60"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-semibold ${
                            isSelected ? "text-wolf-emerald" : "text-white"
                          }`}
                        >
                          {template.name}
                        </h3>
                        {isSelected && (
                          <CheckCircle2
                            className="h-4 w-4 flex-shrink-0 text-wolf-emerald"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-white/50">
            Templates pre-fill the objective and surfaces. You can edit them
            after selecting.
          </p>
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
        <TagInput
          value={formData.surfaces}
          onChange={(surfaces) => setFormData({ ...formData, surfaces })}
          suggestions={OBSERVABLE_ROUTES}
          placeholder="Type route and press Enter, or select from suggestions"
        />
        <p className="text-xs text-white/60">
          Add routes to track. Start typing to see suggestions from existing
          DenLabs routes.
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
