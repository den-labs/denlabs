import AccessGate from "@/components/access/AccessGate";

type AccessPageSearchParams = {
  next?: string;
  walletRequired?: string;
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<AccessPageSearchParams>;
}) {
  const resolved = await searchParams;
  const walletRequired = resolved.walletRequired === "true";
  const nextParam =
    typeof resolved.next === "string" && resolved.next.startsWith("/")
      ? resolved.next
      : undefined;

  return <AccessGate walletRequired={walletRequired} nextPath={nextParam} />;
}
