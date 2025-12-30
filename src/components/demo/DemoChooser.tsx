"use client";

import { Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DemoChooserProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DemoChooser - Modal to choose between Host and Participant demo
 */
export function DemoChooser({ isOpen, onClose }: DemoChooserProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-black via-zinc-950 to-black p-6 shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-white/50 transition hover:bg-white/5 hover:text-white/80"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Try Demo Lab</h2>
          <p className="mt-2 text-sm text-white/60">
            Choose how you want to experience the demo
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Host Console */}
          <Link href="/labs/demo" className="block" onClick={onClose}>
            <div className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-wolf-emerald/50 hover:bg-white/10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-wolf-emerald/10 text-wolf-emerald">
                  <Settings className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-wolf-emerald">
                    Host Console
                  </h3>
                  <p className="mt-1 text-sm text-white/60">
                    View the lab as the organizer. See all feedback, analytics,
                    and export retro packs.
                  </p>
                  <p className="mt-2 text-xs text-wolf-emerald/80">
                    Requires onboarding (wallet + handle)
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Participant View */}
          <Link
            href="/labs/demo/participant"
            className="block"
            onClick={onClose}
          >
            <div className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-wolf-emerald/50 hover:bg-white/10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-blue-400">
                    Participant View
                  </h3>
                  <p className="mt-1 text-sm text-white/60">
                    Experience the lab as a participant. Submit feedback and see
                    top issues.
                  </p>
                  <p className="mt-2 text-xs text-blue-400/80">
                    No onboarding required (public access)
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
