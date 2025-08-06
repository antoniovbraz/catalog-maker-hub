import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="space-y-md">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-border/50">
        {/* Table header */}
        <div className="border-b bg-muted/50 p-md">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr) auto` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        
        {/* Table rows */}
        <div className="space-y-0">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="border-b p-md last:border-b-0">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr) auto` }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4 w-full" />
                ))}
                <Skeleton className="size-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SkeletonFormProps {
  sections?: number;
  fieldsPerSection?: number;
}

export function SkeletonForm({ sections = 2, fieldsPerSection = 3 }: SkeletonFormProps) {
  return (
    <div className="space-y-xl">
      <div className="overflow-hidden rounded-lg border border-border/50">
        {/* Header */}
        <div className="bg-gradient-primary p-lg">
          <Skeleton className="h-6 w-48 bg-white/20" />
        </div>
        
        {/* Form content */}
        <div className="space-y-lg p-lg">
          {Array.from({ length: sections }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-md">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
                  <div key={fieldIndex} className="space-y-sm">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Buttons */}
          <div className="flex gap-3 border-t pt-4">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <div className="space-y-md">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-md rounded-lg border border-border/50 p-lg">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="size-8 rounded" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}