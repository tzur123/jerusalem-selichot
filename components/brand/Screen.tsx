import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Standard mobile-first screen shell: safe-area padding, 100dvh min-height. */
export function Screen({
  children,
  className,
  contain = true,
}: {
  children: ReactNode;
  className?: string;
  contain?: boolean;
}) {
  return (
    <main
      id="main-content"
      className={cn(
        "flex-1 min-h-dvh-safe safe-x flex flex-col",
        contain &&
          "px-6 pt-[max(2.75rem,var(--safe-top))] pb-[max(2rem,var(--safe-bottom))] max-w-lg mx-auto w-full",
        className
      )}
    >
      {children}
    </main>
  );
}
