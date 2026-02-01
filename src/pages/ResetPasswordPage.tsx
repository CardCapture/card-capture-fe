import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
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
import { toast } from "@/lib/toast";
import { logger } from '@/utils/logger';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle both magic link and hash fragment redirect from Supabase
  useEffect(() => {
    const handleAuthRedirect = async () => {
      logger.log("🔍 Current URL:", window.location.href);
      logger.log("🔍 Hash:", location.hash);
      logger.log("🔍 Location state:", location.state);

      // Check if we came from our magic link system
      if (location.state?.fromMagicLink) {
        logger.log("✅ Arrived from magic link system - ready for password reset");
        
        // Clear any existing error since magic link was successful
        setError(null);
        
        // Check if user is authenticated (magic link should have set session)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          logger.log("✅ User session found - ready for password reset");
          setIsAuthenticated(true);
          // Clear the state to prevent re-processing on navigation
          window.history.replaceState(null, "", location.pathname);
          return;
                 } else {
           logger.log("⚠️ No session found, but magic link indicated success");
           // For password reset, we might not always have a session
           // Check if email was passed from magic link
           if (location.state?.email && location.state.email !== 'Please enter your email') {
             setEmail(location.state.email);
             logger.log("✅ Email found from magic link:", location.state.email);
           }
           setIsAuthenticated(false);
           return;
         }
      }

      // If we have a hash in the URL, we were redirected from legacy Supabase auth
      if (location.hash) {
        try {
          // Parse the hash fragment to get the tokens
          const hashParams = new URLSearchParams(location.hash.substring(1));
          logger.log("🔍 Hash params:", Object.fromEntries(hashParams));

          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const type = hashParams.get("type");

          if (accessToken && type === "recovery") {
            logger.log("✅ Found recovery tokens");

            // Set the session with the recovery tokens
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (sessionError) {
              logger.error("❌ Error setting session:", sessionError);
              setError("Error processing reset link. Please try again or contact support.");
              return;
            }

            logger.log("✅ Session set successfully:", data);
            setIsAuthenticated(true);
            
            // Clear the hash without triggering a reload
            window.history.replaceState(null, "", location.pathname);
          } else {
            logger.error("❌ Missing tokens or wrong type. Type:", type);
            setError("Invalid reset link. Please check the link and try again.");
          }
        } catch (err) {
          logger.error("❌ Error handling hash redirect:", err);
          setError("Error processing reset link. Please try again or contact support.");
        }
      } else if (!location.state?.fromMagicLink) {
        // Only show error if this wasn't from our magic link system
        logger.log("ℹ️ No hash fragment found and not from magic link - direct access");
        setError("Please click the reset link from your email, or request a new password reset.");
      }
    };

    handleAuthRedirect();
  }, [location]);

  const passwordRequirements = [
    {
      label: "At least 8 characters long",
      test: (pw: string) => pw.length >= 8,
    },
    {
      label: "One uppercase letter (A-Z)",
      test: (pw: string) => /[A-Z]/.test(pw),
    },
    {
      label: "One lowercase letter (a-z)",
      test: (pw: string) => /[a-z]/.test(pw),
    },
    {
      label: "One number (0-9)",
      test: (pw: string) => /[0-9]/.test(pw),
    },
    {
      label: "One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)",
      test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pw),
    },
  ];

  const getPasswordValidationState = (pw: string) => {
    return passwordRequirements.map((req) => req.test(pw));
  };

  const passwordValidationState = getPasswordValidationState(password);
  const allRequirementsMet = passwordValidationState.every(Boolean);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (!allRequirementsMet) {
      setError("Password does not meet all requirements");
      return;
    }

    // For non-authenticated users (magic link flow), require email
    if (!isAuthenticated && !email) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      if (isAuthenticated) {
        // User has an active session (legacy hash fragment flow)
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          throw updateError;
        }
      } else {
        // User came from magic link, try to sign in with new password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          // If sign in fails, the user probably needs to set their password first
          // We need to call the backend to handle password reset for magic link users
          logger.log("Password reset needed for magic link user");
          setError("Please contact support to complete your password reset, or try using the email link again.");
          return;
        }
      }

      // Show success message
      toast.success("Your password has been reset successfully.", "Success!");

      // Redirect to login page
      navigate("/login", { replace: true });
    } catch (err) {
      logger.error("Error resetting password:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while resetting your password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            {isAuthenticated 
              ? "Please enter your new password below."
              : location.state?.fromMagicLink 
                ? "Your reset link has been verified. Please enter your new password below."
                : "Please enter your email and new password below."
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isAuthenticated && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required={!isAuthenticated}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium">Password requirements:</p>
                <ul className="list-none ml-2">
                  {passwordRequirements.map((req, idx) => (
                    <li key={req.label} className="flex items-center gap-1">
                      {password.length > 0 ? (
                        passwordValidationState[idx] ? (
                          <span className="text-green-600">&#10003;</span>
                        ) : (
                          <span className="text-gray-400">&#10007;</span>
                        )
                      ) : (
                        <span className="text-gray-400">&#10007;</span>
                      )}
                      <span>{req.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !allRequirementsMet}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage; 