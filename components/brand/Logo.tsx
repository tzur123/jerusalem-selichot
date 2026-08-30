import { cn } from "@/lib/utils/cn";

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <div className={cn("flex items-center justify-center select-none", className)} aria-hidden={false}>
      <span
        className={cn(
          "font-heading font-bold tracking-tight text-white",
          size === "lg" ? "text-4xl" : "text-lg"
        )}
      >
        סליחות <span className="text-gradient-gold">ירושלים</span>
      </span>
    </div>
  );
}
