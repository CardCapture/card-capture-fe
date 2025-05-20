// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingLayout from './components/LandingLayout';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TermsPage from './pages/TermsPage';
import Dashboard from './components/EventDetails';
import EventsHome from './components/EventsHome';
import { SettingsPage } from './pages/SettingsPage';
import AdminSettings from './components/AdminSettings';
import NotFound from './pages/NotFound';
import ScanPage from './pages/ScanPage';
import UserManagement from './components/UserManagement';
import GetStartedPage from './pages/GetStartedPage';
import ThankYouPage from './pages/ThankYouPage';
import PrivacyPage from './pages/PrivacyPage';
import AcceptInvitePage from './pages/AcceptInvitePage';

// --- CSS Import ---
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<LandingLayout><Outlet /></LandingLayout>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout><Outlet /></AppLayout>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<EventsHome />} />
              <Route path="/events/:eventId" element={<Dashboard />} />
              <Route path="/settings/account-settings" element={<AdminSettings />} />
              <Route path="/settings/user-management" element={<AdminSettings />} />
              <Route path="/settings/subscription" element={<AdminSettings />} />
              <Route path="/settings/field-preferences" element={<AdminSettings />} />
              <Route path="/settings/integrations" element={<AdminSettings />} />
              <Route path="/settings/field-preferences/manage" element={<SettingsPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/users" element={<UserManagement />} />
            </Route>
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;