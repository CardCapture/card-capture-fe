import { useState } from "react";
import { Link } from "react-router-dom";
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
import { usersApi } from "@/api/backend/users";
import { logger } from "@/utils/logger";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await usersApi.resetPassword(email);
      setSent(true);
      logger.log("Password reset email sent to:", email);
    } catch (err) {
      logger.error("Error requesting password reset:", err);
      setError("Something went wrong. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        {sent ? (
          <>
            <CardHeader>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Didn't get the email? Check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Try Again
              </Button>
            </CardContent>
            <CardFooter>
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-primary hover:underline w-full text-center"
              >
                Back to Login
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={loading}
                  />
                </div>
                {error && <div className="text-sm text-red-500">{error}</div>}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  Back to Login
                </Link>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
