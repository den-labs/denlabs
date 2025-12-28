import { OnboardingGuard } from "@/components/guards/OnboardingGuard";

export default function LabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingGuard>{children}</OnboardingGuard>;
}
