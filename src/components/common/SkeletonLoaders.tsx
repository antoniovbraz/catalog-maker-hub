import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  const gridTemplates: Record<number, string> = {
    1: "[grid-template-columns:1fr_auto]",
    2: "[grid-template-columns:repeat(2,1fr)_auto]",
    3: "[grid-template-columns:repeat(3,1fr)_auto]",
    4: "[grid-template-columns:repeat(4,1fr)_auto]",
    5: "[grid-template-columns:repeat(5,1fr)_auto]",
    6: "[grid-template-columns:repeat(6,1fr)_auto]",
  };
  const gridTemplate = gridTemplates[columns] ?? gridTemplates[4];
  return (
    <div className="space-y-md">
      {/* Header skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-6 w-full max-w-sm md:w-96" />
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <Skeleton className="h-10 w-full max-w-sm md:w-96" />
          <Skeleton className="h-10 w-full sm:w-24" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        {/* Table header */}
        <div className="bg-muted/50 p-md border-b">
          <div className={cn("grid gap-4", gridTemplate)}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full sm:w-20" />
            ))}
            <Skeleton className="h-4 w-full sm:w-16" />
          </div>
        </div>
        
        {/* Table rows */}
        <div className="space-y-0">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="p-md border-b last:border-b-0">
              <div className={cn("grid gap-4", gridTemplate)}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4 w-full" />
                ))}
                <Skeleton className="h-8 w-8 rounded" />
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
      <div className="rounded-lg border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-primary p-lg">
          <Skeleton className="h-6 w-full max-w-sm md:w-96 bg-brand-background/20" />
        </div>
        
        {/* Form content */}
        <div className="p-lg space-y-lg">
          {Array.from({ length: sections }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-md">
              <Skeleton className="h-5 w-full sm:w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
                  <div key={fieldIndex} className="space-y-sm">
                    <Skeleton className="h-4 w-full sm:w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t flex-wrap">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-full sm:w-24" />
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
        <div key={index} className="rounded-lg border border-border/50 p-lg space-y-md">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Skeleton className="h-6 w-full max-w-sm md:w-96" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-6 w-full sm:w-16" />
            <Skeleton className="h-6 w-full sm:w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}