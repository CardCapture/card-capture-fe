import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SchoolService } from "@/services/SchoolService";
import type { SchoolData } from "@/api/supabase/schools";

interface UseSchoolReturn {
  school: SchoolData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateSchool: (updates: Partial<SchoolData>) => Promise<void>;
}

export function useSchool(schoolId?: string): UseSchoolReturn {
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth();

  const fetchSchool = useCallback(async () => {
    if (!schoolId) {
      setSchool(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const schoolData = await SchoolService.getSchoolData(schoolId);
      setSchool(schoolData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err : new Error("Unknown error");
      setError(errorMsg);
      setSchool(null);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const updateSchool = useCallback(
    async (updates: Partial<SchoolData>) => {
      if (!schoolId || !school) {
        throw new Error("No school data available to update");
      }

      try {
        const updatedSchool = await SchoolService.updateSchool(
          schoolId,
          updates
        );
        setSchool(updatedSchool);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err : new Error("Unknown error");
        setError(errorMsg);
        throw errorMsg;
      }
    },
    [schoolId, school]
  );

  useEffect(() => {
    fetchSchool();
  }, [fetchSchool]);

  return {
    school,
    loading,
    error,
    refetch: fetchSchool,
    updateSchool,
  };
}
