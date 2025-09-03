import { Loader2 } from '@/components/ui/icons';
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
};

export function LoadingSpinner({
  size = "md",
  className,
  text
}: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const label = text || t('common.loading');
  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      data-testid="loading-spinner"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2
        className={cn("animate-spin text-muted-foreground", sizeClasses[size])}
        aria-hidden="true"
      />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
}