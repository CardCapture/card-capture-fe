// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// --- Component & Page Imports ---
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import Dashboard from './components/EventDetails';
import DashboardCopy from './components/DashboardCopy';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import AdminSettings from './components/AdminSettings';
import ScanPage from './pages/ScanPage';
import GetStartedPage from './pages/GetStartedPage';
import ThankYouPage from './pages/ThankYouPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import UserManagement from './components/UserManagement';
import AcceptInvitePage from './pages/AcceptInvitePage';

// --- Layout Imports ---
import LandingLayout from './components/LandingLayout';
import AppLayout from './components/AppLayout';

// --- CSS Import ---
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes with Landing Layout --- */}
        <Route element={<LandingLayout><Outlet /></LandingLayout>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
        </Route>

        {/* --- Protected Routes with App Layout --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout><Outlet /></AppLayout>}>
            {/* Redirect /dashboard to /events */}
            <Route path="/dashboard" element={<Navigate to="/events" replace />} />
            <Route path="/events" element={<DashboardCopy />} />
            <Route path="/events/:eventId" element={<Dashboard />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
        </Route>

        {/* --- Catch-all Not Found --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    // Remember: QueryClientProvider, TooltipProvider, AuthProvider should wrap
    // <BrowserRouter> in your src/main.tsx file.
  );
}

export default App;