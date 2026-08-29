import { cn } from "@/lib/utils/cn";

export function Spinner({ className, label = "טוען" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-mint",
        className
      )}
    />
  );
}
