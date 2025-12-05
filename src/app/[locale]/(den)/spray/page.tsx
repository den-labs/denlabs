import SprayDisperser from "@/components/modules/SprayDisperser";
import { requireWallet } from "@/lib/accessGuards";

export default async function SprayPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  requireWallet({ locale, nextPath: "/spray" });
  return <SprayDisperser />;
}
