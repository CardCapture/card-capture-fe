// src/App.tsx
import React, { Suspense } from "react";
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
import SuperAdminRoute from "./components/SuperAdminRoute";
import LandingLayout from "./components/LandingLayout";
import AppLayout from "./components/AppLayout";

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-lg">Loading...</div>
  </div>
);

// Code-split route components with React.lazy
const HomePage = React.lazy(() => import("./pages/HomePage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const TermsPage = React.lazy(() => import("./pages/TermsPage"));
const Dashboard = React.lazy(() => import("./components/EventDetails"));
const EventsHome = React.lazy(() => import("./components/EventsHome"));
const AdminSettings = React.lazy(() => import("./components/AdminSettings"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ScanPage = React.lazy(() => import("./pages/ScanPage"));
const UserManagement = React.lazy(() => import("./components/UserManagement"));
const GetStartedPage = React.lazy(() => import("./pages/GetStartedPage"));
const ThankYouPage = React.lazy(() => import("./pages/ThankYouPage"));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage"));
const AcceptInvitePage = React.lazy(() => import("./pages/AcceptInvitePage"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const ContactPage = React.lazy(() => import("./pages/ContactPage"));
const SuperAdminPage = React.lazy(() => import("./pages/SuperAdminPage"));
const AuthCallback = React.lazy(() => import("./components/AuthCallback"));
const MagicLinkPage = React.lazy(() => import("./pages/MagicLinkPage"));

// --- CSS Import ---
import "./App.css";

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <LoaderProvider>
            <Suspense fallback={<PageLoader />}>
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
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/magic-link" element={<MagicLinkPage />} />
                </Route>

                {/* SuperAdmin routes */}
                <Route
                  element={
                    <SuperAdminRoute>
                      <SuperAdminPage />
                    </SuperAdminRoute>
                  }
                  path="/superadmin"
                />

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
            </Suspense>
            <Toaster />
          </LoaderProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
