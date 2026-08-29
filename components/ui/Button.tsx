import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 min-h-12 px-5 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-mint to-[#00d494] text-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] hover:brightness-105 mint-glow",
  secondary:
    "glass-button bg-white/[0.06] text-white border border-gold/40 hover:border-gold hover:bg-gold/10",
  ghost: "glass-button bg-transparent text-white/80 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10",
  danger:
    "glass-button bg-red-500/10 text-red-300 border border-red-400/40 hover:bg-red-500/15 hover:border-red-400/70",
};

const sizes: Record<Size, string> = {
  md: "text-base",
  lg: "text-lg min-h-14 px-6",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", fullWidth, children, className } = props;
  const classes = cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);

  if ("href" in props && props.href) {
    const { href, target, rel } = props;
    return (
      <Link href={href} target={target} rel={rel} className={classes}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
