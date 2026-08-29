import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)} aria-hidden={false}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-mint to-[#00c98a] text-navy font-black text-lg ring-1 ring-gold/50 shadow-[0_2px_12px_-2px_rgba(0,240,168,0.6)]">
        ס
      </span>
      <span className="font-heading font-bold text-lg tracking-tight text-white">
        סליחות <span className="text-gradient-gold">ירושלים</span>
      </span>
    </div>
  );
}
