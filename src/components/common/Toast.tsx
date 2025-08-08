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
      "group-[.destructive]:border-brand-danger/40 group-[.destructive]:hover:border-brand-danger/30 group-[.destructive]:hover:bg-brand-danger group-[.destructive]:hover:text-brand-background group-[.destructive]:focus:ring-brand-danger",
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
      "group-[.destructive]:text-brand-background/80 group-[.destructive]:hover:text-brand-background group-[.destructive]:focus:ring-brand-danger group-[.destructive]:focus:ring-offset-brand-danger",
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
