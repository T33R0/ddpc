export function GalleryLoadingSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <div 
          key={index}
          className="animate-pulse"
        >
          <div 
            className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 flex flex-col gap-4"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Garage count skeleton */}
            <div className="h-4 w-32 bg-gray-700 rounded" />
            
            {/* Image skeleton */}
            <div className="w-full aspect-video bg-gray-700 rounded-lg" />
            
            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-gray-700 rounded mx-auto" />
              <div className="h-4 w-1/2 bg-gray-700 rounded mx-auto" />
            </div>
            
            {/* Trim info skeleton */}
            <div className="h-8 w-full bg-gray-700 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

