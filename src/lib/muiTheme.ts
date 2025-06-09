import { createTheme } from "@mui/material/styles";

// Create MUI theme that integrates with your existing design
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#3b82f6", // Blue-500 to match your existing blue theme
      light: "#60a5fa", // Blue-400
      dark: "#1d4ed8", // Blue-700
    },
    secondary: {
      main: "#6b7280", // Gray-500
      light: "#9ca3af", // Gray-400
      dark: "#374151", // Gray-700
    },
    error: {
      main: "#ef4444", // Red-500
    },
    warning: {
      main: "#f59e0b", // Amber-500
    },
    success: {
      main: "#10b981", // Emerald-500
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827", // Gray-900
      secondary: "#6b7280", // Gray-500
    },
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif", // Match your existing font
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8, // Match your existing border radius
  },
  components: {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          animationDuration: "1.5s",
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: "#f3f4f6", // Gray-100
        },
      },
    },
  },
});
