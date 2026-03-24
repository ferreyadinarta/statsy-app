"use client";

import { useToast } from "@/lib/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastViewport,
} from "./toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, description, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            {description && <ToastDescription>{description}</ToastDescription>}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
