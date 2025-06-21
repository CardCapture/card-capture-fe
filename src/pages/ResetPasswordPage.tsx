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

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle hash fragment redirect from Supabase
  useEffect(() => {
    const handleHashRedirect = async () => {
      console.log("🔍 Current URL:", window.location.href);
      console.log("🔍 Hash:", location.hash);

      // If we have a hash in the URL, we were redirected from Supabase auth
      if (location.hash) {
        try {
          // Parse the hash fragment to get the tokens
          const hashParams = new URLSearchParams(location.hash.substring(1));
          console.log("🔍 Hash params:", Object.fromEntries(hashParams));

          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const type = hashParams.get("type");

          if (accessToken && type === "recovery") {
            console.log("✅ Found recovery tokens");

            // Set the session with the recovery tokens
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (sessionError) {
              console.error("❌ Error setting session:", sessionError);
              setError("Error processing reset link. Please try again or contact support.");
              return;
            }

            console.log("✅ Session set successfully:", data);
            
            // Clear the hash without triggering a reload
            window.history.replaceState(null, "", location.pathname);
          } else {
            console.error("❌ Missing tokens or wrong type. Type:", type);
            setError("Invalid reset link. Please check the link and try again.");
          }
        } catch (err) {
          console.error("❌ Error handling hash redirect:", err);
          setError("Error processing reset link. Please try again or contact support.");
        }
      } else {
        console.error("❌ No hash fragment found");
        setError("Invalid reset link. Please check the link and try again.");
      }
    };

    handleHashRedirect();
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

    setLoading(true);

    try {
      // Update user with new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      // Show success message
      toast.success("Your password has been reset successfully.", "Success!");

      // Redirect to login page
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error resetting password:", err);
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
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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