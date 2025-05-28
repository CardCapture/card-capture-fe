// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link if needed
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

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithPassword, profile, user } = useAuth(); // Get function from context
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && profile) {
      const redirectPath = getDefaultRedirectPath(profile);
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log("Signing in with email:", email, "and password:", password);
    const { error: signInError } = await signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message); // Show Supabase error message
      setLoading(false);
    } else {
      // Login successful! The useEffect above will handle the redirect
      // once the profile is loaded
      setLoading(false);
    }
  };

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
              <Button
                type="submit"
                className="w-full transition-all duration-200"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
