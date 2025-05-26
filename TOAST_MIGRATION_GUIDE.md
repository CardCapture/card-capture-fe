# Toast System Migration Guide

## Overview

This guide helps you migrate from the old toast system to the new enhanced toast system with modern SaaS patterns.

## ✅ Already Migrated Components

- `CreateEventModal.tsx` ✅
- `ScanFab.tsx` ✅ 
- `InviteUserDialog.tsx` ✅
- `ToastDemo.tsx` ✅ (demo component)

## 🔄 Components Pending Migration

### High Priority (Direct toast usage)
- `EventDetails.tsx` (partial - has type conflicts with hooks)
- `AcceptInvitePage.tsx`
- `ScanPage.tsx`
- `GetStartedPage.tsx`
- `CardScanner.tsx`
- `EditUserModal.tsx`
- `ReviewImagePanel.tsx`
- `EventsHome.tsx`
- `AdminSettings.tsx`

### Medium Priority (Hook-based usage)
- `useCardUpload.ts`
- `useCards.ts`
- `useArchiveCards.ts`

## Migration Steps

### 1. Update Import Statement

**Before:**
```typescript
import { useToast } from "@/hooks/use-toast";
```

**After:**
```typescript
import { toast } from "@/lib/toast";
```

### 2. Remove Hook Usage

**Before:**
```typescript
const { toast } = useToast();
```

**After:**
```typescript
// Remove this line - toast is now imported directly
```

### 3. Update Toast Calls

#### Success Messages
**Before:**
```typescript
toast({
  title: "Success",
  description: "Operation completed successfully",
  variant: "default",
});
```

**After:**
```typescript
toast.success("Operation completed successfully");
// or with custom title:
toast.success("Operation completed successfully", "Custom Title");
```

#### Error Messages
**Before:**
```typescript
toast({
  title: "Error",
  description: "Something went wrong",
  variant: "destructive",
});
```

**After:**
```typescript
toast.error("Something went wrong");
// or with custom title:
toast.error("Something went wrong", "Custom Title");
```

#### Warning Messages
**Before:**
```typescript
toast({
  title: "Warning",
  description: "Please check your input",
  variant: "default", // was often used for warnings
});
```

**After:**
```typescript
toast.warning("Please check your input");
```

#### Info Messages
**Before:**
```typescript
toast({
  title: "Info",
  description: "Here's some information",
  variant: "default",
});
```

**After:**
```typescript
toast.info("Here's some information");
```

### 4. Use Modern SaaS Patterns

#### Common CRUD Operations
```typescript
// Instead of custom success messages
toast.saved();           // "Changes saved successfully"
toast.created("Event");  // "Event created successfully"
toast.updated("Card");   // "Card updated successfully"
toast.deleted("User");   // "User deleted successfully"
```

#### Common Error Patterns
```typescript
toast.saveFailed();           // "Failed to save changes. Please try again."
toast.loadFailed("data");     // "Failed to load data. Please try again."
toast.networkError();         // "Network error. Please check your connection and try again."
```

#### Validation Patterns
```typescript
toast.required("Email address");     // "Email address is required"
toast.invalid("phone number");       // "Please enter a valid phone number"
```

#### Permission Patterns
```typescript
toast.unauthorized();    // "You don't have permission to perform this action"
toast.sessionExpired();  // "Your session has expired. Please log in again."
```

### 5. Bulk Actions

For operations affecting multiple items:

```typescript
import { bulkToast } from "@/lib/toast";

// Success
bulkToast.success(5, "archived", "card");
// → "5 cards archived successfully"

// Error
bulkToast.error(3, "delete", "event");
// → "Failed to delete 3 events"

// Partial success
bulkToast.partial(8, 10, "exported", "record");
// → "8 of 10 records exported successfully"
```

### 6. Promise-Based Operations

For async operations with loading states:

```typescript
import { promiseToast } from "@/lib/toast";

await promiseToast.wrap(uploadCard(), {
  loading: "Uploading card...",
  success: "Card uploaded successfully",
  error: "Failed to upload card"
});
```

## Hook Migration

For custom hooks that accept toast functions, you have two options:

### Option A: Update Hook to Use New Toast System
```typescript
// In the hook file
import { toast } from "@/lib/toast";

export function useMyHook() {
  const handleAction = () => {
    toast.success("Action completed");
  };
}
```

### Option B: Keep Compatibility (Temporary)
```typescript
// In components using the hook
import { useToast } from "@/hooks/use-toast";

const { toast: oldToast } = useToast();
const myHook = useMyHook(oldToast); // Pass old toast to hook
```

## Testing Your Migration

1. **Import the ToastDemo component** to test all toast types:
```typescript
import { ToastDemo } from "@/components/ToastDemo";

// Add to your page temporarily
<ToastDemo />
```

2. **Check for consistent styling** - all toasts should now have:
   - Consistent icons (✓ ✗ ⚠ ℹ)
   - Modern color schemes
   - 3-second auto-close
   - Proper animations

3. **Verify common patterns work**:
   - `toast.saved()` after form submissions
   - `toast.networkError()` for API failures
   - `bulkToast.success()` for bulk operations

## Common Migration Issues

### Issue 1: Type Conflicts with Hooks
**Problem:** Existing hooks expect old toast function signature
**Solution:** Use compatibility wrapper temporarily:
```typescript
const { toast: oldToast } = useToast();
const myHook = useMyHook(oldToast);
```

### Issue 2: Complex Toast Content
**Problem:** Old toasts with custom JSX content
**Solution:** Use `toast.custom()` for advanced cases:
```typescript
toast.custom({
  title: "Custom Toast",
  description: <CustomComponent />,
  variant: "default"
});
```

### Issue 3: Duration Overrides
**Problem:** Need different timeout than 3 seconds
**Solution:** Use custom toast with duration:
```typescript
toast.custom({
  title: "Long Message",
  description: "This stays longer",
  duration: 5000
});
```

## Benefits After Migration

✅ **Consistent UX** - All toasts follow the same modern patterns
✅ **Developer Friendly** - Simple, intuitive API
✅ **Type Safe** - Full TypeScript support
✅ **Maintainable** - Centralized toast logic
✅ **Accessible** - Proper ARIA labels and keyboard navigation
✅ **Modern** - SaaS-style design with icons and colors

## Next Steps

1. Migrate high-priority components first
2. Update custom hooks one by one
3. Test thoroughly in development
4. Remove old toast imports once migration is complete
5. Consider removing Sonner dependency for consistency

## Need Help?

- Check `ToastDemo.tsx` for examples of all patterns
- Review migrated components for reference implementations
- Test with the demo component to see expected behavior 