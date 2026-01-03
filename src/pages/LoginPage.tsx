// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDefaultRedirectPath } from "@/utils/roleRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLoader, ButtonLoader } from "@/contexts/LoaderContext";
import MFAGuard from "@/components/MFAGuard";
import { supabase } from "@/lib/supabaseClient";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showMFAFlow, setShowMFAFlow] = useState(false);
  const { signInWithPassword, profile, user, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state (set by ProtectedRoute)
  const from = (location.state as any)?.from || null;

  // Debug logging
  console.log('LoginPage: location.state =', location.state);
  console.log('LoginPage: from =', from);

  // Use global loader instead of local loading state
  const { showButtonLoader, hideButtonLoader, isLoading } = useLoader();
  const LOADER_ID = "login-button";

  // Redirect if user is already logged in, but not during MFA flow
  useEffect(() => {
    if (user && profile && !showMFAFlow) {
      // Use saved redirect path if available, otherwise use default
      const redirectPath = from || getDefaultRedirectPath(profile);
      console.log('User already logged in, redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, navigate, showMFAFlow, from]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showButtonLoader(LOADER_ID);
    setError(null);

    console.log('=== LOGIN DEBUG ===');
    console.log('Email:', email);
    console.log('Signing in with password - MFA flow enabled');

    try {
      // Sign in with password - then hand off to MFA flow
      const result = await signInWithPassword({ email, password });

      if (result.error) {
        setError(result.error.message || 'Login failed');
        hideButtonLoader(LOADER_ID);
        return;
      }

      // Authentication successful - trigger MFA flow
      // MFAGuard will check device trust and show 2FA challenge if needed
      console.log('Password authentication successful, starting MFA flow');
      setShowMFAFlow(true);
      hideButtonLoader(LOADER_ID);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      hideButtonLoader(LOADER_ID);
    }
  };

  const handleMFASuccess = async () => {
    console.log('=== MFA SUCCESS ===');

    // MFA flow completed successfully (profile already refreshed by MFAGuard)
    console.log('MFA completed, waiting for profile to load before redirecting');

    // Wait for profile state to update (MFAGuard has already called refetchProfile)
    // Give React time to propagate the state update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Re-fetch the latest profile to ensure we have the updated state
    await refetchProfile(true);

    // Small additional delay to ensure ProtectedRoute sees the updated state
    await new Promise(resolve => setTimeout(resolve, 100));

    // Navigate to appropriate page - use saved redirect path if available
    const redirectPath = from || getDefaultRedirectPath(profile);
    console.log('Redirecting to:', redirectPath, '(from saved path:', from, ')');
    navigate(redirectPath, { replace: true });

    setShowMFAFlow(false);
  };

  const handleMFAError = (errorMessage: string) => {
    setError(errorMessage);
    setShowMFAFlow(false);
    hideButtonLoader(LOADER_ID);
  };

  const loading = isLoading(LOADER_ID);

  // MFA flow enabled - will check device trust and require 2FA if needed
  if (showMFAFlow) {
    return (
      <MFAGuard
        email={email}
        password={password}
        onError={handleMFAError}
        onSuccess={handleMFASuccess}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">CC</span>
            </div>
            <span className="font-bold text-2xl tracking-tight">
              CardCapture
            </span>
          </div>
        </div>

        <Card className="w-full border-muted-foreground/20 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your work email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <ButtonLoader id={LOADER_ID}>
                <Button
                  type="submit"
                  className="w-full transition-all duration-200"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </ButtonLoader>
              <div className="text-center text-sm text-muted-foreground">
                New user?{" "}
                <Link
                  to="/signup"
                  className="text-primary hover:underline font-medium"
                >
                  Create an account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;