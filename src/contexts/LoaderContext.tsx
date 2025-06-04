import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Backdrop,
  CircularProgress,
  Box,
  Typography,
  LinearProgress,
  Skeleton,
  TableCell,
  TableRow,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// Loader types enum
export enum LoaderType {
  FULL_PAGE = "full_page",
  TABLE = "table",
  MODAL = "modal",
  BUTTON = "button",
  INLINE = "inline",
  OVERLAY = "overlay",
  SKELETON = "skeleton",
}

// Loader configuration interface
interface LoaderConfig {
  type: LoaderType;
  message?: string;
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "inherit";
  backdrop?: boolean;
  position?: "absolute" | "fixed" | "relative";
}

// Loader state interface
interface LoaderState {
  id: string;
  config: LoaderConfig;
  timestamp: number;
}

// Context interface
interface LoaderContextProps {
  // Core loader management
  showLoader: (id: string, config: LoaderConfig) => void;
  hideLoader: (id: string) => void;
  isLoading: (id: string) => boolean;

  // Convenience methods for specific loader types
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

// Styled components for different loader types
const FullPageBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.modal + 1,
  color: "#fff",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const TableLoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(4),
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const ModalLoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(3),
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const InlineLoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1),
}));

const OverlayContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  gap: theme.spacing(1),
  zIndex: 1,
}));

// Create context
const LoaderContext = createContext<LoaderContextProps | undefined>(undefined);

// Provider component
export const LoaderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loaders, setLoaders] = useState<Map<string, LoaderState>>(new Map());

  // Core loader management
  const showLoader = (id: string, config: LoaderConfig) => {
    setLoaders((prev) => {
      const newLoaders = new Map(prev);
      newLoaders.set(id, {
        id,
        config,
        timestamp: Date.now(),
      });
      return newLoaders;
    });
  };

  const hideLoader = (id: string) => {
    setLoaders((prev) => {
      const newLoaders = new Map(prev);
      newLoaders.delete(id);
      return newLoaders;
    });
  };

  const isLoading = (id: string): boolean => {
    return loaders.has(id);
  };

  // Convenience methods
  const showFullPageLoader = (message = "Loading...") => {
    showLoader("_full_page", {
      type: LoaderType.FULL_PAGE,
      message,
      backdrop: true,
    });
  };

  const hideFullPageLoader = () => {
    hideLoader("_full_page");
  };

  const showTableLoader = (id: string, message = "Loading data...") => {
    showLoader(id, {
      type: LoaderType.TABLE,
      message,
    });
  };

  const hideTableLoader = (id: string) => {
    hideLoader(id);
  };

  const showModalLoader = (id: string, message = "Processing...") => {
    showLoader(id, {
      type: LoaderType.MODAL,
      message,
    });
  };

  const hideModalLoader = (id: string) => {
    hideLoader(id);
  };

  const showButtonLoader = (id: string) => {
    showLoader(id, {
      type: LoaderType.BUTTON,
      size: "small",
    });
  };

  const hideButtonLoader = (id: string) => {
    hideLoader(id);
  };

  const showInlineLoader = (id: string, message?: string) => {
    showLoader(id, {
      type: LoaderType.INLINE,
      message,
      size: "small",
    });
  };

  const hideInlineLoader = (id: string) => {
    hideLoader(id);
  };

  // Bulk operations
  const hideAllLoaders = () => {
    setLoaders(new Map());
  };

  const getActiveLoaders = (): string[] => {
    return Array.from(loaders.keys());
  };

  // Render full page loader if active
  const renderFullPageLoader = () => {
    const fullPageLoader = loaders.get("_full_page");
    if (!fullPageLoader) return null;

    return (
      <FullPageBackdrop open={true}>
        <CircularProgress color="inherit" size={60} />
        {fullPageLoader.config.message && (
          <Typography variant="h6" component="div">
            {fullPageLoader.config.message}
          </Typography>
        )}
      </FullPageBackdrop>
    );
  };

  const contextValue: LoaderContextProps = {
    showLoader,
    hideLoader,
    isLoading,
    showFullPageLoader,
    hideFullPageLoader,
    showTableLoader,
    hideTableLoader,
    showModalLoader,
    hideModalLoader,
    showButtonLoader,
    hideButtonLoader,
    showInlineLoader,
    hideInlineLoader,
    hideAllLoaders,
    getActiveLoaders,
  };

  return (
    <LoaderContext.Provider value={contextValue}>
      {children}
      {renderFullPageLoader()}
    </LoaderContext.Provider>
  );
};

// Hook to use loader context
export const useLoader = (): LoaderContextProps => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
};

// Individual loader components for specific use cases
export const TableLoader: React.FC<{
  id: string;
  message?: string;
  rowCount?: number;
  colCount?: number;
}> = ({ id, message = "Loading...", rowCount = 5, colCount = 4 }) => {
  const { isLoading } = useLoader();

  if (!isLoading(id)) return null;

  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: colCount }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton variant="text" width="100%" height={20} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

export const ModalLoader: React.FC<{ id: string; message?: string }> = ({
  id,
  message = "Processing...",
}) => {
  const { isLoading } = useLoader();

  if (!isLoading(id)) return null;

  return (
    <ModalLoaderContainer>
      <CircularProgress />
      <Typography variant="body2" color="textSecondary">
        {message}
      </Typography>
    </ModalLoaderContainer>
  );
};

export const InlineLoader: React.FC<{
  id: string;
  message?: string;
  size?: "small" | "medium";
}> = ({ id, message, size = "small" }) => {
  const { isLoading } = useLoader();

  if (!isLoading(id)) return null;

  return (
    <InlineLoaderContainer>
      <CircularProgress size={size === "small" ? 16 : 24} />
      {message && (
        <Typography variant="body2" color="textSecondary">
          {message}
        </Typography>
      )}
    </InlineLoaderContainer>
  );
};

export const ButtonLoader: React.FC<{
  id: string;
  children: ReactNode;
  disabled?: boolean;
}> = ({ id, children, disabled }) => {
  const { isLoading } = useLoader();
  const loading = isLoading(id);

  return (
    <Box position="relative" display="inline-block">
      <Box component="span" sx={{ opacity: loading ? 0.5 : 1 }}>
        {children}
      </Box>
      {loading && (
        <>
          <CircularProgress
            size={20}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-10px",
              marginLeft: "-10px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              color: "#666",
            }}
          >
            Loading...
          </div>
        </>
      )}
    </Box>
  );
};

export const OverlayLoader: React.FC<{
  id: string;
  message?: string;
  children: ReactNode;
}> = ({ id, message = "Loading...", children }) => {
  const { isLoading } = useLoader();
  const loading = isLoading(id);

  return (
    <Box position="relative" width="100%" height="100%">
      {children}
      {loading && (
        <OverlayContainer>
          <CircularProgress />
          <Typography variant="body2" color="textSecondary">
            {message}
          </Typography>
        </OverlayContainer>
      )}
    </Box>
  );
};

export const SkeletonLoader: React.FC<{
  id: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  children: ReactNode;
}> = ({ id, variant = "text", width = "100%", height = 20, children }) => {
  const { isLoading } = useLoader();

  if (isLoading(id)) {
    return <Skeleton variant={variant} width={width} height={height} />;
  }

  return <>{children}</>;
};
