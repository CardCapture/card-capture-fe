import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { SchoolService } from "@/services/SchoolService";
import { ProfileService } from "@/services/ProfileService";
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

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<{ name: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract school_id from URL parameters
  const schoolId = searchParams.get("school_id");
  const invitedEmail = searchParams.get("email");

  // Handle both magic link and hash fragment redirect from Supabase
  useEffect(() => {
    const handleAuthRedirect = async () => {
      console.log("🔍 Current URL:", window.location.href);
      console.log("🔍 Hash:", location.hash);
      console.log("🔍 Location state:", location.state);

      // Check if we came from our magic link system
      if (location.state?.fromMagicLink) {
        console.log("✅ Arrived from magic link system - ready for invite acceptance");
        
        // Clear any existing error since magic link was successful
        setError(null);
        
        // Extract email from magic link state
        if (location.state?.email) {
          setEmail(location.state.email);
          console.log("✅ Email found from magic link:", location.state.email);
        } else if (location.state?.needsManualEmail) {
          console.log("⚠️ Manual email entry required");
          // Don't set an error, just let user enter email manually
        }
        
        // Extract metadata from magic link (user info, school info, etc.)
        if (location.state?.metadata) {
          const metadata = location.state.metadata;
          console.log("✅ Metadata found from magic link:", metadata);
          
          // Set email if not already set
          if (!location.state.email && metadata.email) {
            setEmail(metadata.email);
          }
          
          // If we have school_id in metadata, we can use it
          if (metadata.school_id && !schoolId) {
            // Update URL params to include school_id for consistency
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('school_id', metadata.school_id);
            window.history.replaceState(
              null, 
              "",
              `${location.pathname}?${newSearchParams.toString()}`
            );
          }
        }
        
        // Check if user is already authenticated (magic link might have set session)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("✅ User session found from magic link");
          // Get user details
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.email && !email) {
            setEmail(userData.user.email);
          }
        }
        
        // Clear the state to prevent re-processing on navigation
        window.history.replaceState(null, "", location.pathname + location.search);
        return;
      }

      // If we have a hash in the URL, we were redirected from legacy Supabase auth
      if (location.hash) {
        try {
          // Parse the hash fragment to get the tokens
          const hashParams = new URLSearchParams(location.hash.substring(1));
          console.log("🔍 Hash params:", Object.fromEntries(hashParams));

          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const type = hashParams.get("type");

          if (accessToken && (type === "invite" || type === "recovery")) {
            console.log("✅ Found tokens, type:", type);

            // First, clear any existing session to avoid conflicts
            await supabase.auth.signOut();

            // Set the session with both tokens
            const { data, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
              });

            if (sessionError) {
              console.error("❌ Error setting session:", sessionError);
              setError(
                "Error processing invite link. Please try again or contact support."
              );
              return;
            }

            console.log("✅ Session set successfully:", data);

            // Get the user details
            const { data: userData, error: userError } =
              await supabase.auth.getUser();

            if (userError) {
              console.error("❌ Error getting user:", userError);
              setError(
                "Could not verify your identity. Please try again or contact support."
              );
              return;
            }

            // Extract email from the user data
            if (userData?.user?.email) {
              console.log("✅ User email:", userData.user.email);
              setEmail(userData.user.email);
              // Clear the hash without triggering a reload
              window.history.replaceState(
                null,
                "",
                location.pathname + location.search
              );
            } else {
              setError(
                "Could not verify your email. Please try again or contact support."
              );
            }
          } else {
            console.error("❌ Missing tokens or wrong type. Type:", type);
            setError(
              "Invalid invite link. Please check the link and try again."
            );
          }
        } catch (err) {
          console.error("❌ Error handling hash redirect:", err);
          setError(
            "Error processing invite link. Please try again or contact support."
          );
        }
      } else if (!location.state?.fromMagicLink) {
        // Check if we have query parameters instead (some email clients might convert hash to query)
        const queryToken = searchParams.get("access_token");
        const queryType = searchParams.get("type");

        if (
          queryToken &&
          (queryType === "invite" || queryType === "recovery")
        ) {
          console.log(
            "🔍 Found tokens in query params, redirecting to hash format"
          );
          // Redirect to hash format
          window.location.hash = `#${searchParams.toString()}`;
        } else {
          // Only show error if this wasn't from our magic link system
          console.log("ℹ️ No hash fragment or query params found and not from magic link - direct access");
          setError("Please click the invitation link from your email, or request a new invitation.");
        }
      }
    };

    handleAuthRedirect();
  }, [location, searchParams]);

  // Fallback to use invited email from query params or metadata if no email was set from auth flow
  useEffect(() => {
    if (!email) {
      // Try magic link metadata first, then query params
      const metadataEmail = location.state?.metadata?.email;
      const fallbackEmail = metadataEmail || invitedEmail;
      
      if (fallbackEmail) {
        console.log("🔄 Using email from fallback:", fallbackEmail);
        setEmail(fallbackEmail);
      }
    }
  }, [email, invitedEmail, location.state?.metadata?.email]);

  // Fetch school information if school_id is provided
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      // Get school_id from URL params or magic link metadata
      const currentSchoolId = schoolId || 
        (location.state?.metadata?.school_id);
      
      if (currentSchoolId) {
        try {
          const schoolData = await SchoolService.getSchoolData(currentSchoolId);
          setSchoolInfo({ name: schoolData.name });
        } catch (err) {
          console.error("Error fetching school:", err);
        }
      }
    };

    fetchSchoolInfo();
  }, [schoolId, location.state?.metadata?.school_id]);

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
              // For magic link invites, we need a different approach since there might not be an active session
        if (location.state?.fromMagicLink) {
          console.log("🔄 Processing magic link invite - checking session status");
          
          // Check if we already have a session (from successful magic link processing)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log("✅ Found existing session - updating password");
            // User has a session, can directly update password
            const { error: updateError } = await supabase.auth.updateUser({
              password: password,
            });
            
            if (updateError) {
              throw updateError;
            }
            console.log("✅ Password updated successfully");
          } else if (location.state?.hasSession === false) {
            console.log("🔄 No session available - trying to sign in with new password");
            // No session but user should exist - try to sign in with the password they just set
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              console.error("❌ Sign in failed:", signInError.message);
              throw new Error("Unable to sign in with the provided password. The invitation may have expired or the user account may not be properly set up. Please contact support.");
            }
            console.log("✅ Sign in successful");
          } else {
            console.log("🔄 Trying sign in first, then password update if needed");
            // Try to sign in first
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              // Sign in failed, try to update password if we can get a session
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              
              if (currentSession) {
                console.log("🔄 Updating password with existing session");
                const { error: updateError } = await supabase.auth.updateUser({
                  password: password,
                });
                
                if (updateError) {
                  throw updateError;
                }
              } else {
                console.error("❌ No session available for password update");
                throw new Error("Unable to authenticate. Please try signing in with your email and the password you just set, or contact support if this continues.");
              }
            }
            console.log("✅ Authentication successful");
          }
      } else {
        // Legacy flow - user should have an active session
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          throw updateError;
        }

        // Sign in the user with their new credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }
      }

      // Show success message
      toast.success(
        "Your account has been activated successfully.",
        "Success!"
      );

      // If we have a school_id (from URL params or magic link metadata), assign the user to the school
      const currentSchoolId = schoolId || location.state?.metadata?.school_id;
      const userRole = location.state?.metadata?.role || ["admin"]; // Default to admin if not specified
      
      if (currentSchoolId) {
        try {
          // Get the current user ID from the session
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user?.id) {
            await ProfileService.updateProfile(user.id, {
              school_id: currentSchoolId,
              role: Array.isArray(userRole) ? userRole[0] : userRole, // Take first role if array
            });
          }
        } catch (profileError) {
          console.error("Error updating profile:", profileError);
          // Don't throw here - user is already signed up successfully
        }
      }

      // Redirect to events page
      navigate("/events", { replace: true });
    } catch (err) {
      console.error("Error setting password:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while setting your password"
      );
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
            {location.state?.fromMagicLink ? (
              schoolInfo ? (
                <>
                  Your invitation to join <strong>{schoolInfo.name}</strong> has been verified.
                  Please set a password for your account to complete the registration process.
                </>
              ) : (
                "Your invitation has been verified. Please set a password for your account to complete the registration process."
              )
            ) : schoolInfo ? (
              <>
                You've been invited to join <strong>{schoolInfo.name}</strong>{" "}
                as an administrator. Please set a password for your account to
                complete the registration process.
              </>
            ) : (
              "Please set a password for your account to complete the registration process."
            )}
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
                disabled={!!email && !location.state?.needsManualEmail}
                placeholder={location.state?.needsManualEmail ? "Enter your email address" : ""}
                required
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
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
              {loading ? "Setting Password..." : "Set Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AcceptInvitePage;
