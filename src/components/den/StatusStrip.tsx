"use client";

import { type ComponentProps, useEffect, useState } from "react";
import HowlBadge from "@/components/ui/HowlBadge";
import SelfBadge from "@/components/ui/SelfBadge";
import {
  getSelfVerification,
  subscribeToSelfVerification,
} from "@/lib/selfVerification";

type StatusStripProps = {
  level?: ComponentProps<typeof HowlBadge>["level"];
  className?: string;
};

export function StatusStrip({
  level = "Lobo",
  className = "",
}: StatusStripProps) {
  const [isSelfVerified, setIsSelfVerified] = useState(false);
  const socialLinks = [
    {
      href: "https://github.com/wolfcito/wolf-den",
      label: "GitHub",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          role="img"
          aria-hidden="true"
        >
          <path
            d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.6.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.3-3.4-1.3-.4-1-.9-1.3-.9-1.3-.7-.5.1-.5.1-.5.8.1 1.3.9 1.3.9.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-2.2-.3-4.5-1.2-4.5-5.2 0-1.1.4-2 1-2.7-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.7 1 .8-.2 1.6-.3 2.5-.3.9 0 1.7.1 2.5.3 1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.5.7.7 1 1.6 1 2.7 0 4-2.3 4.9-4.5 5.2.3.2.6.7.6 1.4v2.1c0 .3.2.6.7.5 3.9-1.3 6.8-5.1 6.8-9.6C22 6.6 17.5 2 12 2Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      href: "https://x.com/AKAwolfcito",
      label: "X",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          role="img"
          aria-hidden="true"
        >
          <path
            d="M4.5 3h3.1l4 5.7L15.3 3H19l-5.3 7.3L20 21h-3.1l-4.4-6.3-4.4 6.3H4l6.3-8.7L4.5 3Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setIsSelfVerified(getSelfVerification());
    return subscribeToSelfVerification(setIsSelfVerified);
  }, []);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        <HowlBadge level={level} />
        <SelfBadge status={isSelfVerified ? "verified" : "pending"} />
      </div>
      <div className="flex items-center gap-2">
        {socialLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-wolf-border bg-wolf-charcoal-70 text-wolf-foreground transition hover:border-wolf-border-xstrong hover:text-wolf-emerald"
            aria-label={link.label}
            title={link.label}
          >
            {link.icon}
            <span className="sr-only">{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default StatusStrip;
