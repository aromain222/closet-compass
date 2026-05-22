import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "blush" | "mauve" | "taupe" | "lavender" | "warm" | "success" | "muted";
  size?: "sm" | "md";
}

export function Badge({ variant = "warm", size = "sm", children, className = "", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    blush: "bg-blush/30 text-blush-dark border-blush/40",
    mauve: "bg-mauve/20 text-mauve-dark border-mauve/30",
    taupe: "bg-taupe/20 text-warm-mid border-taupe/30",
    lavender: "bg-lavender/20 text-lavender-dark border-lavender/30",
    warm: "bg-petal text-warm-mid border-border-soft",
    success: "bg-success-soft/20 text-green-700 border-success-soft/40",
    muted: "bg-petal/60 text-muted border-border-soft/60",
  };

  const sizes: Record<string, string> = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
