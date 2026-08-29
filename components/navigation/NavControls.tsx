import { cn } from "@/lib/utils/cn";

export function NavControlButton({
  onClick,
  label,
  active,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full glass-card text-xl transition-colors",
        active && "border-mint text-mint"
      )}
    >
      {children}
    </button>
  );
}
