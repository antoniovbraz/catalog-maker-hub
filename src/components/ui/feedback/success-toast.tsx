import { useEffect } from "react";
import { CheckCircle2 } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface SuccessToastProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export function SuccessToast({ message, onClose, className }: SuccessToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white shadow",
        className
      )}
    >
      <CheckCircle2 className="size-4" />
      <span>{message}</span>
    </div>
  );
}
