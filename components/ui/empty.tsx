import { type LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-petal flex items-center justify-center">
          <Icon size={24} className="text-muted" strokeWidth={1.5} />
        </div>
      )}
      <div className="space-y-1.5">
        <p className="font-display text-xl font-light text-warm-dark">{title}</p>
        {description && <p className="text-sm text-muted max-w-xs text-balance">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
