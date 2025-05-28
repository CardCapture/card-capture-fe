import React from 'react';
import { Button } from '@/components/ui/button';
import { toast, bulkToast, promiseToast } from '@/lib/toast';

export function ToastDemo() {
  const handleSuccessToast = () => {
    toast.success("Card uploaded successfully");
  };

  const handleErrorToast = () => {
    toast.error("Failed to save changes. Please try again.");
  };

  const handleWarningToast = () => {
    toast.warning("Your session will expire in 5 minutes");
  };

  const handleInfoToast = () => {
    toast.info("New features are available in the settings panel");
  };

  const handleLoadingToast = () => {
    toast.loading("Processing your request...");
  };

  const handleCommonPatterns = () => {
    // Common SaaS patterns
    toast.saved();
    setTimeout(() => toast.deleted("Card"), 1000);
    setTimeout(() => toast.created("Event"), 2000);
    setTimeout(() => toast.networkError(), 3000);
  };

  const handleBulkActions = () => {
    // Bulk action examples
    bulkToast.success(5, "archived", "card");
    setTimeout(() => bulkToast.error(3, "delete", "event"), 1000);
    setTimeout(() => bulkToast.partial(8, 10, "exported", "record"), 2000);
  };

  const handlePromiseToast = async () => {
    // Promise-based toast example
    const mockApiCall = () => new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve("Success!") : reject(new Error("API Error"));
      }, 2000);
    });

    try {
      await promiseToast.wrap(mockApiCall(), {
        loading: "Uploading card...",
        success: "Card uploaded successfully",
        error: "Failed to upload card"
      });
    } catch (error) {
      // Error already handled by promiseToast
    }
  };

  const handleValidationToasts = () => {
    toast.required("Email address");
    setTimeout(() => toast.invalid("phone number"), 500);
    setTimeout(() => toast.unauthorized(), 1000);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Enhanced Toast System Demo</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Basic Toast Types</h3>
          <Button onClick={handleSuccessToast} variant="default" className="w-full">
            Success Toast
          </Button>
          <Button onClick={handleErrorToast} variant="destructive" className="w-full">
            Error Toast
          </Button>
          <Button onClick={handleWarningToast} variant="outline" className="w-full">
            Warning Toast
          </Button>
          <Button onClick={handleInfoToast} variant="secondary" className="w-full">
            Info Toast
          </Button>
          <Button onClick={handleLoadingToast} variant="outline" className="w-full">
            Loading Toast
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">SaaS Patterns</h3>
          <Button onClick={handleCommonPatterns} variant="default" className="w-full">
            Common Patterns
          </Button>
          <Button onClick={handleBulkActions} variant="default" className="w-full">
            Bulk Actions
          </Button>
          <Button onClick={handlePromiseToast} variant="default" className="w-full">
            Promise Toast
          </Button>
          <Button onClick={handleValidationToasts} variant="default" className="w-full">
            Validation Toasts
          </Button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Usage Examples:</h4>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`// Basic usage
toast.success("Card uploaded successfully");
toast.error("Failed to save changes");
toast.warning("Session expiring soon");

// Common patterns
toast.saved();
toast.deleted("Card");
toast.networkError();

// Bulk actions
bulkToast.success(5, "archived", "card");
// → "5 cards archived successfully"

// Promise wrapper
await promiseToast.wrap(apiCall(), {
  loading: "Uploading...",
  success: "Upload complete",
  error: "Upload failed"
});`}
        </pre>
      </div>
    </div>
  );
} 