import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Standard mobile-first screen shell: safe-area padding, 100dvh min-height. */
export function Screen({
  children,
  className,
  contain = true,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  contain?: boolean;
  /** For text-heavy marketing/content pages: grows wider on tablet/desktop instead
   * of staying phone-width, so long-form copy doesn't read as a thin column. */
  wide?: boolean;
}) {
  return (
    <main
      id="main-content"
      className={cn(
        "flex-1 min-h-dvh-safe safe-x flex flex-col",
        contain &&
          cn(
            "px-6 pt-[max(2.75rem,var(--safe-top))] pb-[max(2rem,var(--safe-bottom))] mx-auto w-full",
            wide ? "max-w-lg sm:max-w-2xl lg:max-w-3xl" : "max-w-lg"
          ),
        className
      )}
    >
      {children}
    </main>
  );
}
