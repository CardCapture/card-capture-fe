import { useToast } from "@/hooks/use-toast" // Ensure path is correct
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast" // Ensure path is correct

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="w-auto max-w-sm">
            <div className="grid gap-1.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-4 right-4 flex flex-col gap-2 w-full max-w-sm" />
    </ToastProvider>
  )
}