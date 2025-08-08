import * as React from "react";
import {
  ToastProvider,
  ToastViewport,
  Toast as UiToast,
  ToastTitle,
  ToastDescription,
  ToastAction as UiToastAction,
  ToastClose as UiToastClose,
  type ToastProps,
  type ToastActionElement,
} from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ToastAction = React.forwardRef<
  React.ElementRef<typeof UiToastAction>,
  React.ComponentPropsWithoutRef<typeof UiToastAction>
>(({ className, ...props }, ref) => (
  <UiToastAction
    ref={ref}
    className={cn(
      "group-[.destructive]:border-destructive/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = UiToastAction.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof UiToastClose>,
  React.ComponentPropsWithoutRef<typeof UiToastClose>
>(({ className, ...props }, ref) => (
  <UiToastClose
    ref={ref}
    className={cn(
      "group-[.destructive]:text-destructive-foreground/80 group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive group-[.destructive]:focus:ring-offset-destructive",
      className
    )}
    {...props}
  />
));
ToastClose.displayName = UiToastClose.displayName;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  UiToast as Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
};
