export function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin text-muted ${className}`}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Spinner size={28} />
      <p className="text-sm text-muted">Loading…</p>
    </div>
  );
}
