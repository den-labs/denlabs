import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary";
}

export function Badge({
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-[#89e24a]/20 text-[#89e24a]",
    outline: "border-white/20 bg-transparent text-white/70",
    secondary: "border-white/10 bg-white/5 text-white/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
