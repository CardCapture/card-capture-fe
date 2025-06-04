// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { LoaderProvider } from "./contexts/LoaderContext";
import { muiTheme } from "./lib/muiTheme";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import LandingLayout from "./components/LandingLayout";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import TermsPage from "./pages/TermsPage";
import Dashboard from "./components/EventDetails";
import EventsHome from "./components/EventsHome";
import AdminSettings from "./components/AdminSettings";
import NotFound from "./pages/NotFound";
import ScanPage from "./pages/ScanPage";
import UserManagement from "./components/UserManagement";
import GetStartedPage from "./pages/GetStartedPage";
import ThankYouPage from "./pages/ThankYouPage";
import PrivacyPage from "./pages/PrivacyPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

// --- CSS Import ---
import "./App.css";

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <LoaderProvider>
            <Routes>
              {/* Public routes */}
              <Route
                element={
                  <LandingLayout>
                    <Outlet />
                  </LandingLayout>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/get-started" element={<GetStartedPage />} />
                <Route path="/thank-you" element={<ThankYouPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/accept-invite" element={<AcceptInvitePage />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route
                  element={
                    <AppLayout>
                      <Outlet />
                    </AppLayout>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route
                    path="/events"
                    element={
                      <RoleProtectedRoute
                        requiredPermission="canAccessEventsPage"
                        fallbackPath="/scan"
                      >
                        <EventsHome />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/events/:eventId"
                    element={
                      <RoleProtectedRoute
                        requiredPermission="canAccessEventsPage"
                        fallbackPath="/scan"
                      >
                        <Dashboard />
                      </RoleProtectedRoute>
                    }
                  />

                  {/* Role-protected routes */}
                  <Route
                    path="/scan"
                    element={
                      <RoleProtectedRoute requiredPermission="canAccessScanPage">
                        <ScanPage />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/settings/account-settings"
                    element={
                      <RoleProtectedRoute requiredPermission="canAccessSettings">
                        <AdminSettings />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/user-management"
                    element={
                      <RoleProtectedRoute requiredPermission="canAccessSettings">
                        <AdminSettings />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/subscription"
                    element={
                      <RoleProtectedRoute requiredPermission="canAccessSettings">
                        <AdminSettings />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/field-preferences"
                    element={
                      <RoleProtectedRoute requiredPermission="canAccessSettings">
                        <AdminSettings />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/majors"
                    element={
                      <RoleProtectedRoute requiredPermission="canAccessSettings">
                        <AdminSettings />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/integrations"
                    element={
                      <RoleProtectedRoute requiredPermission="canAccessSettings">
                        <AdminSettings />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route
                    path="/users"
                    element={
                      <RoleProtectedRoute requiredPermission="canManageUsers">
                        <UserManagement />
                      </RoleProtectedRoute>
                    }
                  />
                </Route>
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </LoaderProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
