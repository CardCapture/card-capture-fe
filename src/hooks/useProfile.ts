import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileService } from "@/services/ProfileService";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  school_id: string;
  role: string | string[];
  last_sign_in_at?: string | null;
}

interface UseProfileReturn {
  profile: UserProfile | null;
  schoolId: string | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const profileData = await ProfileService.getProfile(session.user.id);
      setProfile(profileData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err : new Error("Unknown error");
      setError(errorMsg);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    schoolId: profile?.school_id || null,
    loading,
    error,
    refetch: fetchProfile,
  };
}
