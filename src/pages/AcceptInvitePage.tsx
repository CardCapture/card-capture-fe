import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Handle hash fragment redirect from Supabase
  useEffect(() => {
    const handleHashRedirect = async () => {
      // If we have a hash in the URL, we were redirected from Supabase auth
      if (location.hash) {
        try {
          // Parse the hash fragment to get the access token
          const hashParams = new URLSearchParams(location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const type = hashParams.get('type');
          
          if (accessToken && type === 'invite') {
            // Set the session manually
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || ''
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              setError('Error processing invite link');
              return;
            }
            
            // Extract email from the JWT token
            if (data.session?.user?.email) {
              setEmail(data.session.user.email);
            }
            
            // Clear the hash without triggering a reload
            window.history.replaceState(null, '', location.pathname + location.search);
          }
        } catch (err) {
          console.error('Error handling hash redirect:', err);
          setError('Error processing invite link');
        }
      }
    };

    handleHashRedirect();
  }, [location]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return;
    }

    setLoading(true);

    try {
      // Update user with new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      // Show success message
      toast({
        title: "Success!",
        description: "Your account has been activated successfully.",
      });

      // Sign in the user with their new credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      // Redirect to events page
      navigate('/events', { replace: true });
    } catch (err) {
      console.error('Error setting password:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while setting your password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Your Password</CardTitle>
          <CardDescription>
            Please set a password for your account to complete the registration process.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AcceptInvitePage; 