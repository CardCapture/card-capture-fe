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
import { Input } from "@/components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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

interface SftpConfig {
  id?: string;
  school_id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  remote_path: string;
  enabled: boolean;
  last_sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const SettingsPreferences: React.FC = () => {
  const { toast } = useToast();
  const { session, user } = useAuth();
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [cardFields, setCardFields] = useState<CardFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SFTP Config State
  const [sftpConfig, setSftpConfig] = useState<SftpConfig | null>(null);
  const [sftpLoading, setSftpLoading] = useState(true);
  const [sftpSaving, setSftpSaving] = useState(false);
  const [sftpError, setSftpError] = useState<string | null>(null);

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

  // Fetch SFTP config for current school
  useEffect(() => {
    const fetchSftpConfig = async () => {
      setSftpLoading(true);
      setSftpError(null);
      try {
        // Get school_id from profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", user?.id)
          .maybeSingle();
        if (profileError) throw new Error("Failed to fetch profile");
        if (!profile?.school_id) throw new Error("No school ID found in profile");
        // Fetch sftp config row
        const { data, error: sftpError } = await supabase
          .from("sftp_configs")
          .select("*")
          .eq("school_id", profile.school_id)
          .maybeSingle();
        if (sftpError) throw new Error("Failed to fetch SFTP config");
        if (!data) {
          setSftpConfig({
            host: "",
            port: 22,
            username: "",
            password: "",
            remote_path: "",
            enabled: false,
            school_id: profile.school_id,
          });
        } else {
          setSftpConfig(data as SftpConfig);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Error fetching SFTP config";
        setSftpError(errorMsg);
        setSftpConfig(null);
      } finally {
        setSftpLoading(false);
      }
    };
    if (user?.id) fetchSftpConfig();
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

  // SFTP Save handler
  const handleSftpSave = async () => {
    if (!sftpConfig) return;
    setSftpSaving(true);
    setSftpError(null);
    try {
      const now = new Date().toISOString();
      // Omit id for upsert (let DB generate if new)
      const { id, ...configToSave } = sftpConfig;
      configToSave.updated_at = now;

      // Validate required fields
      ["host", "remote_path", "username", "password"].forEach(field => {
        if (!configToSave[field]) {
          throw new Error(`${field} is required`);
        }
      });
      configToSave.port = Number(configToSave.port);
      if (isNaN(configToSave.port) || configToSave.port < 1 || configToSave.port > 65535) {
        throw new Error("Port must be a valid number between 1 and 65535");
      }
      if (typeof configToSave.enabled !== "boolean") {
        configToSave.enabled = Boolean(configToSave.enabled);
      }

      // Log the data we're trying to save
      console.log('Attempting to save SFTP config:', configToSave);

      const { data, error: upsertError } = await supabase
        .from("sftp_configs")
        .upsert([configToSave], { 
          onConflict: "school_id",
          ignoreDuplicates: false 
        })
        .select();

      if (upsertError) {
        console.error('SFTP save error:', upsertError);
        throw new Error(`Failed to save SFTP config: ${upsertError.message}`);
      }

      console.log('SFTP config saved successfully:', data);
      toast({
        title: "SFTP Config Saved",
        description: "Your Slate SFTP integration settings have been updated.",
      });
      setSftpConfig({ ...sftpConfig, updated_at: now });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error saving SFTP config";
      console.error('SFTP save error:', err);
      setSftpError(errorMsg);
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setSftpSaving(false);
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
    <Accordion type="multiple" defaultValue={[]}>
      <AccordionItem value="card-fields">
        <AccordionTrigger>Card Field Preferences</AccordionTrigger>
        <AccordionContent>
          <Card className="max-h-[80vh] flex flex-col mb-4">
            <CardHeader>
              <CardTitle>Card Field Preferences</CardTitle>
              <CardDescription>
                Toggle which fields you want to display or use on cards. Changes are
                saved per user and school.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
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
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="sftp">
        <AccordionTrigger>Slate Integration (SFTP)</AccordionTrigger>
        <AccordionContent>
          <Card className="max-h-[80vh] flex flex-col">
            <CardHeader>
              <CardTitle>Slate Integration (SFTP)</CardTitle>
              <CardDescription>
                Configure SFTP credentials for Slate integration. These settings are saved per school.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {sftpLoading ? (
                <div className="text-gray-500">Loading SFTP config...</div>
              ) : sftpError ? (
                <div className="text-red-500">{sftpError}</div>
              ) : sftpConfig ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSftpSave();
                  }}
                  className="space-y-4"
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sftp-host">Host</Label>
                    <Input
                      id="sftp-host"
                      type="text"
                      value={sftpConfig.host}
                      onChange={e => setSftpConfig({ ...sftpConfig, host: e.target.value })}
                      disabled={sftpSaving}
                      required
                      placeholder="e.g. ft.technolutions.net"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sftp-port">Port</Label>
                    <Input
                      id="sftp-port"
                      type="number"
                      value={sftpConfig.port}
                      onChange={e => setSftpConfig({ ...sftpConfig, port: Number(e.target.value) })}
                      disabled={sftpSaving}
                      required
                      min={1}
                      max={65535}
                      placeholder="e.g. 22"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sftp-username">Username</Label>
                    <Input
                      id="sftp-username"
                      type="text"
                      value={sftpConfig.username}
                      onChange={e => setSftpConfig({ ...sftpConfig, username: e.target.value })}
                      disabled={sftpSaving}
                      required
                      placeholder="e.g. cardcapture"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sftp-password">Password</Label>
                    <Input
                      id="sftp-password"
                      type="password"
                      value={sftpConfig.password}
                      onChange={e => setSftpConfig({ ...sftpConfig, password: e.target.value })}
                      disabled={sftpSaving}
                      required
                      placeholder="Enter SFTP password"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sftp-remote-path">Remote Path</Label>
                    <Input
                      id="sftp-remote-path"
                      type="text"
                      value={sftpConfig.remote_path}
                      onChange={e => setSftpConfig({ ...sftpConfig, remote_path: e.target.value })}
                      disabled={sftpSaving}
                      required
                      placeholder="e.g. /test/incoming/cardcapture"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="sftp-enabled">Enable SFTP Integration</Label>
                    <Switch
                      id="sftp-enabled"
                      checked={sftpConfig.enabled}
                      onCheckedChange={(checked) => setSftpConfig({ ...sftpConfig, enabled: checked })}
                      disabled={sftpSaving}
                    />
                  </div>
                  <CardFooter className="justify-end px-0 pb-0">
                    <Button type="submit" disabled={sftpSaving}>
                      {sftpSaving ? "Saving..." : "Save"}
                    </Button>
                  </CardFooter>
                </form>
              ) : (
                <div className="text-gray-500">No SFTP config found.</div>
              )}
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SettingsPreferences;
