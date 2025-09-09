// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import MFALoginFlow from "@/components/MFALoginFlow";
import { supabase } from "@/lib/supabaseClient";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showMFAFlow, setShowMFAFlow] = useState(false);
  const { signInWithPassword, profile, user } = useAuth();
  const navigate = useNavigate();

  // Use global loader instead of local loading state
  const { showButtonLoader, hideButtonLoader, isLoading } = useLoader();
  const LOADER_ID = "login-button";

  // Redirect if user is already logged in, but not during MFA flow
  useEffect(() => {
    if (user && profile && !showMFAFlow) {
      const redirectPath = getDefaultRedirectPath(profile);
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, navigate, showMFAFlow]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showButtonLoader(LOADER_ID);
    setError(null);
    
    console.log('=== LOGIN DEBUG ===');
    console.log('Email:', email);
    console.log('About to show MFA flow');
    
    // Instead of directly signing in, show MFA flow which will handle everything
    setShowMFAFlow(true);
    hideButtonLoader(LOADER_ID);
  };

  const handleMFASuccess = async () => {
    console.log('=== MFA SUCCESS ===');
    
    // MFA enrollment completed successfully
    console.log('MFA enrollment completed, checking auth state');
    
    // Wait a moment for auth state to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the current session to ensure auth state is updated
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session after MFA:', session);
    
    if (session) {
      // Session is ready, redirect to /events
      console.log('Session confirmed, redirecting to /events');
      navigate('/events', { replace: true });
    } else {
      // If no session yet, try to refresh and redirect
      console.log('No session found, attempting to refresh');
      window.location.href = '/events';
    }
    
    setShowMFAFlow(false);
  };

  const handleMFAError = (errorMessage: string) => {
    setError(errorMessage);
    setShowMFAFlow(false);
    hideButtonLoader(LOADER_ID);
  };

  const loading = isLoading(LOADER_ID);

  // If MFA flow is active, show it instead of login form
  if (showMFAFlow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <div className="w-full max-w-md">
          <MFALoginFlow
            email={email}
            password={password}
            onError={handleMFAError}
            onSuccess={handleMFASuccess}
          />
        </div>
      </div>
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
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;