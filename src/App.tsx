// src/App.tsx
import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { LoaderProvider } from "./contexts/LoaderContext";
import { muiTheme } from "./lib/muiTheme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import LandingLayout from "./components/LandingLayout";
import AppLayout from "./components/AppLayout";
import MinimalLayout from "./components/MinimalLayout";

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
const StudentSignupPage = React.lazy(() => import("./pages/StudentSignupPage"));
const StudentLookupPage = React.lazy(() => import("./pages/StudentLookupPage"));
const MFASettingsPage = React.lazy(() => import("./pages/MFASettingsPage"));

// New registration system pages
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const CheckEmailPage = React.lazy(() => import("./pages/CheckEmailPage"));
const CheckPhonePage = React.lazy(() => import("./pages/CheckPhonePage"));
const RegistrationFormPage = React.lazy(() => import("./pages/RegistrationFormPage"));
const MultiStepRegistrationPage = React.lazy(() => import("./pages/MultiStepRegistrationPage"));
const RegistrationSuccessPage = React.lazy(() => import("./pages/RegistrationSuccessPage"));
const VerifyEmailPage = React.lazy(() => import("./pages/VerifyEmailPage"));
const MagicLinkVerifyPage = React.lazy(() => import("./pages/MagicLinkVerifyPage"));

// Recruiter self-service signup pages
const RecruiterSignupPage = React.lazy(() => import("./pages/RecruiterSignupPage"));
const EventSelectionPage = React.lazy(() => import("./pages/EventSelectionPage"));
const SignupSuccessPage = React.lazy(() => import("./pages/SignupSuccessPage"));

// Admin event purchase page
const PurchaseEventsPage = React.lazy(() => import("./pages/PurchaseEventsPage"));

// Public event submission page
const CreateEventPage = React.lazy(() => import("./pages/CreateEventPage"));

// Student self-service manage page (token-based, opened from SMS/email links)
const StudentManagePage = React.lazy(() => import("./pages/StudentManagePage"));

// Documentation page
const DocsPage = React.lazy(() => import("./pages/DocsPage"));

// --- CSS Import ---
import "./App.css";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
                  <Route path="/for-coordinators" element={<HomePage />} />
                  <Route path="/for-students" element={<HomePage />} />
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
                  <Route path="/create-event" element={<CreateEventPage />} />
                  <Route path="/docs" element={<DocsPage />} />

                  {/* Legacy student registration (keeping for backwards compatibility) */}
                  <Route path="/register-legacy" element={<StudentSignupPage />} />
                  <Route path="/register/form-legacy" element={<RegistrationFormPage />} />
                  <Route path="/lookup" element={<StudentLookupPage />} />
                  <Route path="/student-manage" element={<StudentManagePage />} />
                </Route>

                {/* Registration flow with minimal layout (no header/footer) */}
                <Route
                  element={
                    <MinimalLayout>
                      <Outlet />
                    </MinimalLayout>
                  }
                >
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/register/check-email" element={<CheckEmailPage />} />
                  <Route path="/register/check-phone" element={<CheckPhonePage />} />
                  <Route path="/register/verify" element={<MagicLinkVerifyPage />} />
                  <Route path="/register/form" element={<MultiStepRegistrationPage />} />
                  <Route path="/register/success" element={<RegistrationSuccessPage />} />
                  <Route path="/register/verify-email" element={<VerifyEmailPage />} />
                </Route>

                {/* Recruiter self-service signup flow (minimal layout) */}
                <Route
                  element={
                    <MinimalLayout>
                      <Outlet />
                    </MinimalLayout>
                  }
                >
                  <Route path="/signup" element={<RecruiterSignupPage />} />
                  <Route path="/signup/select-event" element={<EventSelectionPage />} />
                  <Route path="/signup/success" element={<SignupSuccessPage />} />
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

                    {/* Event purchase route for admins and recruiters */}
                    <Route
                      path="/purchase-events"
                      element={
                        <RoleProtectedRoute requiredPermission="canPurchaseEvents">
                          <PurchaseEventsPage />
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
                      path="/settings/security"
                      element={
                        <ProtectedRoute>
                          <MFASettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/events"
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
    </QueryClientProvider>
  );
}

export default App;
