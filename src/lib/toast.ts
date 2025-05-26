import { toast as baseToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import React from "react";

// Modern SaaS toast types with consistent styling
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number; // Override default 3s if needed
  action?: React.ReactNode;
}

interface ToastConfig {
  variant: "default" | "destructive";
  icon: React.ReactNode;
  defaultTitle: string;
}

// Modern SaaS toast configurations
const toastConfigs: Record<ToastType, ToastConfig> = {
  success: {
    variant: "default",
    icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-500" }),
    defaultTitle: "Success"
  },
  error: {
    variant: "destructive", 
    icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-500" }),
    defaultTitle: "Error"
  },
  warning: {
    variant: "default",
    icon: React.createElement(AlertTriangle, { className: "h-4 w-4 text-yellow-500" }),
    defaultTitle: "Warning"
  },
  info: {
    variant: "default",
    icon: React.createElement(Info, { className: "h-4 w-4 text-blue-500" }),
    defaultTitle: "Info"
  },
  loading: {
    variant: "default",
    icon: React.createElement(Loader2, { className: "h-4 w-4 text-blue-500 animate-spin" }),
    defaultTitle: "Loading"
  }
};

// Enhanced toast function with consistent styling
function createToast(type: ToastType, options: ToastOptions) {
  const config = toastConfigs[type];
  
  return baseToast({
    variant: config.variant,
    title: options.title || config.defaultTitle,
    description: options.description ? React.createElement(
      'div',
      { className: 'flex items-start gap-2' },
      config.icon,
      React.createElement('span', { className: 'flex-1' }, options.description)
    ) : undefined,
    action: options.action,
  });
}

// Convenient toast methods for common use cases
export const toast = {
  // Success toasts - for completed actions
  success: (message: string, title?: string) => 
    createToast('success', { 
      title: title || "Success", 
      description: message 
    }),

  // Error toasts - for failures and errors  
  error: (message: string, title?: string) => 
    createToast('error', { 
      title: title || "Error", 
      description: message 
    }),

  // Warning toasts - for important notices
  warning: (message: string, title?: string) => 
    createToast('warning', { 
      title: title || "Warning", 
      description: message 
    }),

  // Info toasts - for general information
  info: (message: string, title?: string) => 
    createToast('info', { 
      title: title || "Info", 
      description: message 
    }),

  // Loading toasts - for ongoing operations
  loading: (message: string, title?: string) => 
    createToast('loading', { 
      title: title || "Loading", 
      description: message 
    }),

  // Custom toast for advanced use cases
  custom: (options: ToastOptions & { variant?: "default" | "destructive" }) => 
    baseToast(options),

  // Common SaaS patterns
  saved: () => toast.success("Changes saved successfully"),
  deleted: (item?: string) => toast.success(`${item || "Item"} deleted successfully`),
  created: (item?: string) => toast.success(`${item || "Item"} created successfully`),
  updated: (item?: string) => toast.success(`${item || "Item"} updated successfully`),
  
  // Error patterns
  saveFailed: () => toast.error("Failed to save changes. Please try again."),
  deleteFailed: (item?: string) => toast.error(`Failed to delete ${item || "item"}. Please try again.`),
  loadFailed: (item?: string) => toast.error(`Failed to load ${item || "data"}. Please try again.`),
  networkError: () => toast.error("Network error. Please check your connection and try again."),
  
  // Validation patterns
  required: (field: string) => toast.warning(`${field} is required`),
  invalid: (field: string) => toast.warning(`Please enter a valid ${field}`),
  
  // Permission patterns
  unauthorized: () => toast.error("You don't have permission to perform this action"),
  sessionExpired: () => toast.warning("Your session has expired. Please log in again."),
};

// Bulk action toast helpers
export const bulkToast = {
  success: (count: number, action: string, item: string = "item") => {
    const plural = count === 1 ? item : `${item}s`;
    return toast.success(`${count} ${plural} ${action} successfully`);
  },
  
  error: (count: number, action: string, item: string = "item") => {
    const plural = count === 1 ? item : `${item}s`;
    return toast.error(`Failed to ${action} ${count} ${plural}`);
  },
  
  partial: (success: number, total: number, action: string, item: string = "item") => {
    const plural = total === 1 ? item : `${item}s`;
    return toast.warning(`${success} of ${total} ${plural} ${action} successfully`);
  }
};

// Promise-based toast for async operations
export const promiseToast = {
  async wrap<T>(
    promise: Promise<T>, 
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> {
    const loadingToast = toast.loading(messages.loading);
    
    try {
      const result = await promise;
      loadingToast.dismiss();
      toast.success(messages.success);
      return result;
    } catch (error) {
      loadingToast.dismiss();
      toast.error(messages.error);
      throw error;
    }
  }
};

export default toast;
