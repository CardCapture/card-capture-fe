# Global Loader Context System

## Overview

The Global Loader Context is a comprehensive loading state management system built with MUI (Material-UI) that provides centralized control over all loading states throughout the application. It supports multiple loader types and ensures consistent UX across all components.

## Features

### ✅ **Loader Types Supported**
- **Full Page Loader**: Backdrop overlay for entire application
- **Table Loader**: Skeleton rows for table loading states
- **Modal Loader**: Loading states within modals/dialogs
- **Button Loader**: Loading states for buttons with spinner overlay
- **Inline Loader**: Small inline loading indicators
- **Overlay Loader**: Loading overlay for specific containers
- **Skeleton Loader**: Flexible skeleton loading for any content

### ✅ **Key Benefits**
- **Centralized Management**: All loading states managed from one context
- **Type Safety**: Full TypeScript support with proper interfaces
- **Performance Optimized**: Efficient state management with Map-based storage
- **MUI Integration**: Seamless integration with Material-UI components
- **Flexible API**: Both convenience methods and granular control
- **Consistent UX**: Unified loading experience across the app

## Installation & Setup

### 1. Dependencies
```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

### 2. Integration in App.tsx
```tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LoaderProvider } from './contexts/LoaderContext';
import { muiTheme } from './lib/muiTheme';

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <LoaderProvider>
        {/* Your app content */}
      </LoaderProvider>
    </ThemeProvider>
  );
}
```

## Usage Examples

### Basic Hook Usage
```tsx
import { useLoader } from '@/contexts/LoaderContext';

const MyComponent = () => {
  const { showTableLoader, hideTableLoader, isLoading } = useLoader();
  const LOADER_ID = 'my-table';

  const fetchData = async () => {
    showTableLoader(LOADER_ID, "Loading data...");
    try {
      // API call
    } finally {
      hideTableLoader(LOADER_ID);
    }
  };

  return (
    <Table>
      <TableBody>
        <TableLoader id={LOADER_ID} rowCount={5} colCount={4} />
        {!isLoading(LOADER_ID) && data.map(item => (
          <TableRow key={item.id}>...</TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

### Button Loader
```tsx
import { ButtonLoader } from '@/contexts/LoaderContext';

const MyButton = () => {
  const { showButtonLoader, hideButtonLoader } = useLoader();
  const LOADER_ID = 'submit-button';

  const handleSubmit = async () => {
    showButtonLoader(LOADER_ID);
    try {
      // Submit logic
    } finally {
      hideButtonLoader(LOADER_ID);
    }
  };

  return (
    <ButtonLoader id={LOADER_ID}>
      <Button onClick={handleSubmit}>
        Submit
      </Button>
    </ButtonLoader>
  );
};
```

### Full Page Loader
```tsx
const MyPage = () => {
  const { showFullPageLoader, hideFullPageLoader } = useLoader();

  const loadPage = async () => {
    showFullPageLoader("Loading page...");
    try {
      // Page loading logic
    } finally {
      hideFullPageLoader();
    }
  };

  // Loader automatically renders as backdrop
};
```

## API Reference

### Core Methods
```tsx
interface LoaderContextProps {
  // Core management
  showLoader: (id: string, config: LoaderConfig) => void;
  hideLoader: (id: string) => void;
  isLoading: (id: string) => boolean;
  
  // Convenience methods
  showFullPageLoader: (message?: string) => void;
  hideFullPageLoader: () => void;
  showTableLoader: (id: string, message?: string) => void;
  hideTableLoader: (id: string) => void;
  showModalLoader: (id: string, message?: string) => void;
  hideModalLoader: (id: string) => void;
  showButtonLoader: (id: string) => void;
  hideButtonLoader: (id: string) => void;
  showInlineLoader: (id: string, message?: string) => void;
  hideInlineLoader: (id: string) => void;
  
  // Bulk operations
  hideAllLoaders: () => void;
  getActiveLoaders: () => string[];
}
```

### Loader Components
```tsx
// Table skeleton loader
<TableLoader id="table-id" rowCount={5} colCount={4} />

// Modal loading state
<ModalLoader id="modal-id" message="Processing..." />

// Inline loading indicator
<InlineLoader id="inline-id" message="Loading..." size="small" />

// Button with loading overlay
<ButtonLoader id="button-id">
  <Button>Click me</Button>
</ButtonLoader>

// Container with loading overlay
<OverlayLoader id="overlay-id" message="Loading...">
  <div>Content to overlay</div>
</OverlayLoader>

// Conditional skeleton
<SkeletonLoader id="skeleton-id" variant="text" width="100%" height={20}>
  <span>Actual content</span>
</SkeletonLoader>
```

## Implementation Status

### ✅ **Completed Integrations**
- **LoaderContext**: Core context with all loader types
- **MUI Theme**: Integrated theme provider
- **App.tsx**: Provider setup
- **useCardsOverride**: Table loader for cards data
- **UserManagement**: Table loader for users table
- **LoginPage**: Button loader for sign-in

### 🔄 **Recommended Next Steps**
1. **AdminSettings**: Replace multiple loading states with appropriate loaders
2. **EventsHome**: Table loader for events list
3. **EventDetails**: Various loaders for different sections
4. **ScanPage**: Overlay loader for scanning operations
5. **CreateEventModal**: Modal loader for event creation
6. **EditUserModal**: Modal loader for user updates
7. **InviteUserDialog**: Modal loader for invitations

### 📋 **Integration Checklist**
For each component with data fetching:
- [ ] Import `useLoader` hook
- [ ] Replace `useState` loading states
- [ ] Use appropriate loader type (table, button, modal, etc.)
- [ ] Add unique `LOADER_ID` for each loader
- [ ] Implement `showLoader` before async operations
- [ ] Implement `hideLoader` in finally blocks
- [ ] Add loader components to JSX
- [ ] Test loading states

## Best Practices

### 1. **Unique Loader IDs**
```tsx
// Good: Descriptive and unique
const LOADER_ID = 'user-management-table';
const BUTTON_LOADER_ID = 'save-settings-button';

// Bad: Generic or conflicting
const LOADER_ID = 'loading';
const LOADER_ID = 'table'; // Could conflict
```

### 2. **Proper Cleanup**
```tsx
const fetchData = async () => {
  showTableLoader(LOADER_ID, "Loading...");
  try {
    const data = await api.getData();
    setData(data);
  } catch (error) {
    console.error(error);
  } finally {
    hideTableLoader(LOADER_ID); // Always in finally
  }
};
```

### 3. **Conditional Rendering**
```tsx
<TableBody>
  <TableLoader id={LOADER_ID} rowCount={5} colCount={4} />
  {!isLoading(LOADER_ID) && data.length === 0 && (
    <TableRow>
      <TableCell colSpan={4}>No data found</TableCell>
    </TableRow>
  )}
  {!isLoading(LOADER_ID) && data.map(item => (
    <TableRow key={item.id}>...</TableRow>
  ))}
</TableBody>
```

### 4. **Error Handling**
```tsx
const handleSubmit = async () => {
  showButtonLoader(LOADER_ID);
  try {
    await submitData();
    toast.success("Saved successfully");
  } catch (error) {
    toast.error("Failed to save");
  } finally {
    hideButtonLoader(LOADER_ID); // Always hide loader
  }
};
```

## Troubleshooting

### Common Issues

1. **Loader not showing**: Check if `LOADER_ID` is unique and `showLoader` is called
2. **Loader not hiding**: Ensure `hideLoader` is in `finally` block
3. **Multiple loaders**: Use different IDs for different loading states
4. **TypeScript errors**: Import types from `@/contexts/LoaderContext`

### Debug Methods
```tsx
const { getActiveLoaders } = useLoader();
console.log('Active loaders:', getActiveLoaders());
```

## Migration Guide

### From Local Loading States
```tsx
// Before
const [loading, setLoading] = useState(false);
const [tableLoading, setTableLoading] = useState(false);

// After
const { showTableLoader, hideTableLoader, isLoading } = useLoader();
const LOADER_ID = 'my-table';
```

### From Custom Spinners
```tsx
// Before
{loading && <div className="spinner">Loading...</div>}

// After
<InlineLoader id="my-loader" message="Loading..." />
```

This Global Loader Context provides a robust, scalable solution for managing all loading states in your application with consistent UX and excellent developer experience. 