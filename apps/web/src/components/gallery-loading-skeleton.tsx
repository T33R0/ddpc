export function GalleryLoadingSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="animate-pulse"
        >
          <div
            className="bg-background/50 backdrop-blur-lg rounded-2xl p-4 flex flex-col gap-4 border border-border"
          >
            {/* Garage count skeleton */}
            <div className="h-4 w-32 bg-muted rounded" />

            {/* Image skeleton */}
            <div className="w-full aspect-video bg-muted rounded-lg" />

            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-muted rounded mx-auto" />
              <div className="h-4 w-1/2 bg-muted rounded mx-auto" />
            </div>

            {/* Trim info skeleton */}
            <div className="h-8 w-full bg-muted rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

