"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { CheckCircle, XCircle, X } from "lucide-react";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className="fixed top-4 right-4 z-[100] flex flex-col-reverse gap-2 w-full max-w-[420px] p-4 pointer-events-none sm:flex-col"
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

type ToastProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitives.Root
> & {
  variant?: "success" | "error";
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ variant = "success", ...props }, ref) => {
  const borderColor = variant === "success" ? "#1a7a4a" : "#d32f2f";
  const iconColor = variant === "success" ? "#1a7a4a" : "#d32f2f";

  return (
    <ToastPrimitives.Root
      ref={ref}
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[4px] shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:duration-300 data-[state=closed]:duration-200"
      style={{
        background: "white",
        border: `1.5px solid ${borderColor}`,
      }}
      {...props}
    >
      {variant === "success" ? (
        <CheckCircle size={18} style={{ color: iconColor, flexShrink: 0 }} />
      ) : (
        <XCircle size={18} style={{ color: iconColor, flexShrink: 0 }} />
      )}
      {props.children}
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className="transition-colors rounded-[4px] p-1"
    style={{ color: "#8a8070" }}
    onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1714")}
    onMouseLeave={(e) => (e.currentTarget.style.color = "#8a8070")}
    {...props}
  >
    <X size={14} />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className="flex-1 text-sm font-medium"
    style={{ color: "#1a1714" }}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export { ToastProvider, ToastViewport, Toast, ToastClose, ToastDescription };
export type { ToastProps };
