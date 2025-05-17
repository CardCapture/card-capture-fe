import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CardField {
  name: string;
  label: string;
  enabled: boolean;
}

const CARD_FIELDS: CardField[] = [
  { name: "name", label: "Name", enabled: true },
  { name: "preferred_first_name", label: "Preferred First Name", enabled: true },
  { name: "date_of_birth", label: "Date of Birth", enabled: true },
  { name: "email", label: "Email", enabled: true },
  { name: "cell", label: "Phone", enabled: true },
  { name: "permission_to_text", label: "Permission to Text", enabled: true },
  { name: "address", label: "Address", enabled: true },
  { name: "city", label: "City", enabled: true },
  { name: "state", label: "State", enabled: true },
  { name: "zip_code", label: "ZIP Code", enabled: true },
  { name: "high_school", label: "High School", enabled: true },
  { name: "class_rank", label: "Class Rank", enabled: true },
  { name: "students_in_class", label: "Students in Class", enabled: true },
  { name: "gpa", label: "GPA", enabled: true },
  { name: "student_type", label: "Student Type", enabled: true },
  { name: "entry_term", label: "Entry Term", enabled: true },
  { name: "major", label: "Major", enabled: true },
];

interface SFTPConfig {
  host: string;
  username: string;
  password: string;
  upload_path: string;
}

const SettingsPreferences: React.FC = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [cardFields, setCardFields] = useState<Record<string, boolean>>({});
  const [sftpConfig, setSftpConfig] = useState<SFTPConfig>({
    host: "",
    username: "",
    password: "",
    upload_path: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [session]);

  const fetchSettings = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", session.user.id)
        .single();

      if (!profile?.school_id) {
        throw new Error("No school ID found");
      }

      // Fetch card field preferences
      const { data: settings } = await supabase
        .from("settings")
        .select("preferences")
        .eq("user_id", session.user.id)
        .eq("school_id", profile.school_id)
        .single();

      if (settings?.preferences?.card_fields) {
        setCardFields(settings.preferences.card_fields);
      } else {
        // Initialize with all fields enabled
        const initialFields = CARD_FIELDS.reduce((acc, field) => {
          acc[field.name] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setCardFields(initialFields);
      }

      // Fetch SFTP config
      const { data: sftpData } = await supabase
        .from("sftp_configs")
        .select("*")
        .eq("school_id", profile.school_id)
        .single();

      if (sftpData) {
        setSftpConfig({
          host: sftpData.host || "",
          username: sftpData.username || "",
          password: sftpData.password || "",
          upload_path: sftpData.upload_path || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCardFields = async () => {
    if (!session?.user?.id) return;

    try {
      setSaving(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", session.user.id)
        .single();

      if (!profile?.school_id) {
        throw new Error("No school ID found");
      }

      const { error } = await supabase
        .from("settings")
        .upsert({
          user_id: session.user.id,
          school_id: profile.school_id,
          preferences: {
            card_fields: cardFields,
          },
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Card field preferences saved successfully.",
      });
    } catch (error) {
      console.error("Error saving card fields:", error);
      toast({
        title: "Error",
        description: "Failed to save card field preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSftpConfig = async () => {
    if (!session?.user?.id) return;

    try {
      setSaving(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", session.user.id)
        .single();

      if (!profile?.school_id) {
        throw new Error("No school ID found");
      }

      const { error } = await supabase
        .from("sftp_configs")
        .upsert({
          school_id: profile.school_id,
          ...sftpConfig,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "SFTP configuration saved successfully.",
      });
    } catch (error) {
      console.error("Error saving SFTP config:", error);
      toast({
        title: "Error",
        description: "Failed to save SFTP configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testSftpConnection = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/test-sftp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sftpConfig),
      });

      if (!response.ok) {
        throw new Error("Connection test failed");
      }

      toast({
        title: "Success",
        description: "SFTP connection test successful.",
      });
    } catch (error) {
      console.error("Error testing SFTP connection:", error);
      toast({
        title: "Error",
        description: "Failed to test SFTP connection. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-4">
      {/* Card Field Preferences */}
      <AccordionItem value="card-fields" className="border rounded-lg">
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <div className="flex flex-col items-start text-left">
            <CardTitle className="text-xl">Card Field Preferences</CardTitle>
            <CardDescription>
              Choose which fields to capture when scanning cards.
            </CardDescription>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CARD_FIELDS.map((field) => (
                <div key={field.name} className="flex items-center space-x-2">
                  <Switch
                    id={field.name}
                    checked={cardFields[field.name] ?? true}
                    onCheckedChange={(checked) =>
                      setCardFields((prev) => ({ ...prev, [field.name]: checked }))
                    }
                  />
                  <Label htmlFor={field.name}>{field.label}</Label>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-end px-6 pb-4">
            <Button onClick={saveCardFields} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </AccordionContent>
      </AccordionItem>

      {/* Slate Integration (SFTP) */}
      <AccordionItem value="sftp" className="border rounded-lg">
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <div className="flex flex-col items-start text-left">
            <CardTitle className="text-xl">Slate Integration (SFTP)</CardTitle>
            <CardDescription>
              Enter your Slate SFTP credentials to enable export.
            </CardDescription>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={sftpConfig.host}
                onChange={(e) =>
                  setSftpConfig((prev) => ({ ...prev, host: e.target.value }))
                }
                placeholder="ft.technolutions.net"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={sftpConfig.username}
                onChange={(e) =>
                  setSftpConfig((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="your-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={sftpConfig.password}
                onChange={(e) =>
                  setSftpConfig((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload_path">Upload Path</Label>
              <Input
                id="upload_path"
                value={sftpConfig.upload_path}
                onChange={(e) =>
                  setSftpConfig((prev) => ({ ...prev, upload_path: e.target.value }))
                }
                placeholder="/test/incoming/cardcapture"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end space-x-2 px-6 pb-4">
            <Button
              variant="outline"
              onClick={testSftpConnection}
              disabled={saving}
            >
              Test Connection
            </Button>
            <Button onClick={saveSftpConfig} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SettingsPreferences;
