import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  isLoading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function CustomModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveText = "Salvar",
  cancelText = "Cancelar",
  isLoading = false,
  className,
  size = "md",
}: CustomModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl", 
    xl: "max-w-4xl",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "gap-0 p-0 overflow-hidden",
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b bg-background">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isLoading}
            className="min-w-[80px] bg-foreground text-background hover:bg-foreground/90"
          >
            {isLoading ? "Salvando..." : saveText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}