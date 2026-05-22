import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ hover = false, padding = "md", children, className = "", ...props }: CardProps) {
  const paddings: Record<string, string> = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={`bg-card rounded-2xl border border-soft card-shadow ${paddings[padding]} ${
        hover ? "hover:card-shadow-hover transition-shadow cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
