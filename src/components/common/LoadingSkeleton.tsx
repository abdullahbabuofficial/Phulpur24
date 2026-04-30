interface LoadingSkeletonProps {
  variant?: 'article-card' | 'article-lead' | 'list-item' | 'text';
  count?: number;
}

function SkeletonBox({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function LoadingSkeleton({ variant = 'article-card', count = 1 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === 'article-lead') {
    return (
      <div className="animate-pulse">
        <SkeletonBox className="w-full h-64 md:h-96 rounded-xl mb-4" />
        <SkeletonBox className="h-4 w-24 mb-2" />
        <SkeletonBox className="h-8 w-3/4 mb-2" />
        <SkeletonBox className="h-4 w-full mb-1" />
        <SkeletonBox className="h-4 w-2/3" />
      </div>
    );
  }

  if (variant === 'list-item') {
    return (
      <>
        {items.map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse py-3 border-b border-brand-border">
            <SkeletonBox className="w-20 h-16 flex-shrink-0 rounded" />
            <div className="flex-1">
              <SkeletonBox className="h-3 w-16 mb-2" />
              <SkeletonBox className="h-4 w-full mb-1" />
              <SkeletonBox className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (variant === 'text') {
    return (
      <div className="animate-pulse space-y-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
        <SkeletonBox className="h-4 w-4/6" />
      </div>
    );
  }

  return (
    <>
      {items.map((_, i) => (
        <div key={i} className="animate-pulse">
          <SkeletonBox className="w-full h-48 rounded-lg mb-3" />
          <SkeletonBox className="h-3 w-20 mb-2" />
          <SkeletonBox className="h-5 w-full mb-1" />
          <SkeletonBox className="h-5 w-4/5 mb-2" />
          <SkeletonBox className="h-3 w-32" />
        </div>
      ))}
    </>
  );
}
