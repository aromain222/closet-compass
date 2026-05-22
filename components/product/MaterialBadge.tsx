import type { MaterialConfidenceLabel } from "@/lib/products/types";
import { Badge } from "@/components/ui/badge";

interface MaterialBadgeProps {
  label: MaterialConfidenceLabel;
  fibers?: string[];
}

export function MaterialBadge({ label, fibers }: MaterialBadgeProps) {
  const variants: Record<MaterialConfidenceLabel, { color: "success" | "mauve" | "muted"; text: string }> = {
    high: { color: "success", text: "Quality verified" },
    medium: { color: "mauve", text: "Mostly verified" },
    low: { color: "muted", text: "Unverified materials" },
  };

  const { color, text } = variants[label];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={color}>{text}</Badge>
      {fibers?.slice(0, 3).map((f) => (
        <Badge key={f} variant="taupe" size="sm">
          {f}
        </Badge>
      ))}
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  score: number;
  color?: string;
}

export function ScoreBar({ label, score, color = "bg-mauve" }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-petal overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className="text-xs text-warm-mid w-7 text-right tabular-nums">{score}</span>
    </div>
  );
}
