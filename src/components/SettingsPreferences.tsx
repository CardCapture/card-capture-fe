import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface CardFields {
  [key: string]: boolean;
}

interface SettingsRow {
  id: string;
  user_id: string;
  school_id: string;
  preferences: {
    card_fields?: CardFields;
    [key: string]: unknown;
  };
}

export const SettingsPreferences: React.FC = () => {
  const { toast } = useToast();
  const { session, user } = useAuth();
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [cardFields, setCardFields] = useState<CardFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings row for user + school
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get school_id from profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", user?.id)
          .maybeSingle();
        if (profileError) throw new Error("Failed to fetch profile");
        if (!profile?.school_id)
          throw new Error("No school ID found in profile");
        // Fetch settings row
        const { data, error: settingsError } = await supabase
          .from("settings")
          .select("*")
          .eq("user_id", user?.id)
          .eq("school_id", profile.school_id)
          .maybeSingle();
        if (settingsError) throw new Error("Failed to fetch settings");
        if (!data) {
          setSettings(null);
          setCardFields(null);
        } else {
          setSettings(data as SettingsRow);
          setCardFields(data.preferences?.card_fields || null);
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Error fetching settings";
        setError(errorMsg);
        setSettings(null);
        setCardFields(null);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchSettings();
  }, [user?.id]);

  // Handle toggle
  const handleToggle = (key: string) => {
    if (!cardFields) return;
    setCardFields({ ...cardFields, [key]: !cardFields[key] });
  };

  // Save handler
  const handleSave = async () => {
    if (!settings || !cardFields) return;
    setSaving(true);
    setError(null);
    try {
      const newPreferences = {
        ...settings.preferences,
        card_fields: cardFields,
      };
      const { error: updateError } = await supabase
        .from("settings")
        .update({ preferences: newPreferences })
        .eq("id", settings.id);
      if (updateError) throw new Error("Failed to save preferences");
      toast({
        title: "Preferences saved",
        description: "Your card field preferences have been updated.",
      });
      setSettings({ ...settings, preferences: newPreferences });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error saving preferences";
      setError(errorMsg);
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-gray-500">
          Loading account settings...
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-500">{error}</CardContent>
      </Card>
    );
  }
  if (!settings || !cardFields) {
    return (
      <Card>
        <CardContent className="p-6 text-gray-500">
          No Account Setting has been added so far.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Card Field Preferences</CardTitle>
        <CardDescription>
          Toggle which fields you want to display or use on cards. Changes are
          saved per user and school.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.keys(cardFields).map((key) => {
            // Format key: replace underscores with spaces and capitalize each word
            const label = key
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            return (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <Label htmlFor={`switch-${key}`}>{label}</Label>
                <Switch
                  id={`switch-${key}`}
                  checked={!!cardFields[key]}
                  onCheckedChange={() => handleToggle(key)}
                  disabled={saving}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SettingsPreferences;
