import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center select-none", className)} aria-hidden={false}>
      <span className="font-heading font-bold text-lg tracking-tight text-white">
        סליחות <span className="text-gradient-gold">ירושלים</span>
      </span>
    </div>
  );
}
