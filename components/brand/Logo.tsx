import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)} aria-hidden={false}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint text-navy font-black text-lg">
        ס
      </span>
      <span className="font-black text-lg tracking-tight text-white">
        סליחות <span className="text-mint">ירושלים</span>
      </span>
    </div>
  );
}
