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
      className={cn(
        "flex-1 min-h-dvh-safe safe-top safe-bottom safe-x flex flex-col",
        contain && "px-4 py-6 max-w-lg mx-auto w-full",
        className
      )}
    >
      {children}
    </main>
  );
}
