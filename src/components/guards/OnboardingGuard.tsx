"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  checkOnboardingStatus,
  getOnboardingRedirectUrl,
} from "@/lib/onboardingGuard";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * OnboardingGuard - Protects Host Console routes (/en/labs)
 *
 * Redirects to /en/access if:
 * - Wallet not connected OR
 * - Handle not set
 *
 * Self verification is optional and doesn't block access
 * (shows banner instead)
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      setIsChecking(true);

      const status = await checkOnboardingStatus();

      if (!status.isOnboarded) {
        // User needs to complete onboarding
        const redirectUrl = getOnboardingRedirectUrl(pathname);
        router.push(redirectUrl);
        return;
      }

      // User is onboarded, allow access
      setIsOnboarded(true);
      setIsChecking(false);
    }

    checkAccess();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-wolf-emerald" />
          <p className="mt-4 text-sm text-white/60">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isOnboarded) {
    // Don't render anything while redirecting
    return null;
  }

  return <>{children}</>;
}
