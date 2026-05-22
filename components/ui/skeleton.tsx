function Bone({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-petal ${className}`} />
  );
}

export function SearchResultCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-soft card-shadow overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <Bone className="w-full sm:w-52 aspect-[3/4] sm:aspect-auto sm:h-72 rounded-none rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none shrink-0" />

        {/* Content */}
        <div className="flex-1 p-5 space-y-4">
          {/* Brand + title */}
          <div className="space-y-2">
            <Bone className="h-3 w-16" />
            <Bone className="h-5 w-3/4" />
            <Bone className="h-3 w-24" />
          </div>

          {/* Price */}
          <div className="flex gap-2">
            <Bone className="h-6 w-16" />
            <Bone className="h-6 w-12" />
          </div>

          {/* Material chips */}
          <div className="space-y-2">
            <Bone className="h-3 w-20" />
            <div className="flex gap-2 flex-wrap">
              <Bone className="h-7 w-20 rounded-full" />
              <Bone className="h-7 w-16 rounded-full" />
              <Bone className="h-7 w-24 rounded-full" />
            </div>
          </div>

          {/* Score bars */}
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Bone className="h-3 w-16" />
                <Bone className="h-1.5 flex-1" />
                <Bone className="h-3 w-6" />
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="flex gap-2 pt-2">
            <Bone className="h-9 flex-1 rounded-full" />
            <Bone className="h-9 flex-1 rounded-full" />
            <Bone className="h-9 flex-1 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SearchResultCardSkeleton key={i} />
      ))}
    </div>
  );
}
