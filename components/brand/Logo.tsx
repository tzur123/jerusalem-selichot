import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  // The large hero placement (landing page) uses the illustrated wordmark;
  // smaller chrome placements (admin header/login) keep the plain text mark.
  if (size === "lg") {
    return (
      <div className={cn("flex items-center justify-center select-none", className)}>
        <Image
          src="/brand/logo-selichot-wordmark.png"
          alt="סליחות ירושלים"
          width={953}
          height={557}
          priority
          className="h-auto w-[230px]"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center select-none", className)} aria-hidden={false}>
      <span className="font-heading font-bold tracking-tight text-white text-lg">
        סליחות <span className="text-gradient-gold">ירושלים</span>
      </span>
    </div>
  );
}
