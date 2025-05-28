import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InviteUserDialog } from "./InviteUserDialog";
import { EditUserModal } from "./EditUserModal";
import { useAuth } from "@/contexts/AuthContext";
import { User, CreditCard, Settings, ListFilter, Users, Database, GraduationCap, Trash2, Plus, PencilLine, Check, X } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabaseClient";
import SettingsPreferences from "./SettingsPreferences";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from '@/lib/toast';
import { updateSchoolCardFields } from "@/lib/api";
import { CardFieldPreferences } from "@/components/CardFieldPreferences";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { authFetch } from "@/lib/authFetch";
import { Textarea } from "@/components/ui/textarea";

const NAV_ITEMS = [
  {
    id: "account-settings",
    label: "Account Settings",
    icon: <Settings className="w-5 h-5 mr-2" />,
  },
  {
    id: "user-management",
    label: "User Management",
    icon: <Users className="w-5 h-5 mr-2" />,
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: <CreditCard className="w-5 h-5 mr-2" />,
  },
  {
    id: "field-preferences",
    label: "Field Preferences",
    icon: <ListFilter className="w-5 h-5 mr-2" />,
  },
  {
    id: "majors",
    label: "Majors",
    icon: <GraduationCap className="w-5 h-5 mr-2" />,
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: <Database className="w-5 h-5 mr-2" />,
  },
];

const PRICING_DISPLAY: Record<string, string> = {
  starter: "$5,000/year",
  professional: "$7,500/year",
  enterprise: "Custom pricing",
};

interface UserToEdit {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ('admin' | 'recruiter' | 'reviewer')[];
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  last_sign_in_at?: string | null;
  school_id?: string;
}

interface SchoolRecord {
  id: string;
  name: string;
  email: string;
  stripe_customer_id: string | null;
  created_at: string;
}

interface SFTPConfig {
  host: string;
  username: string;
  password: string;
  upload_path: string;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

// Add canonical field definitions
const CANONICAL_CARD_FIELDS = [
  'name',
  'preferred_first_name',
  'date_of_birth',
  'email',
  'cell',
  'permission_to_text',
  'address',
  'city',
  'state',
  'zip_code',
  'high_school',
  'class_rank',
  'students_in_class',
  'gpa',
  'student_type',
  'entry_term',
  'major',
  'city_state',
];

interface CardField {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
}

interface CardFieldValue {
  enabled: boolean;
  required: boolean;
}

interface CardFields {
  [key: string]: CardFieldValue;
}

const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  // Get the active tab from the URL
  const activeTab = location.pathname.split('/').pop() || 'account-settings';

  // If we're at /settings, redirect to /settings/account-settings
  if (location.pathname === '/settings') {
    return <Navigate to="/settings/account-settings" replace />;
  }

  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserToEdit | null>(null);

  // School state for subscription tab
  const [school, setSchool] = useState<SchoolRecord | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);

  // SFTP state
  const [sftpConfig, setSftpConfig] = useState<SFTPConfig>({
    host: "",
    username: "",
    password: "",
    upload_path: "",
  });
  const [saving, setSaving] = useState(false);

  // Field preferences state
  const [fields, setFields] = useState<CardField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [initialFields, setInitialFields] = useState<CardField[]>([]);

  // Majors state
  const [majors, setMajors] = useState<string>("");
  const [majorsList, setMajorsList] = useState<string[]>([]);
  const [editedMajors, setEditedMajors] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [addMajorInput, setAddMajorInput] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [initialMajors, setInitialMajors] = useState<string>("");
  const [loadingMajors, setLoadingMajors] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Scroll to top when fields are updated after a save (field-preferences tab only)
  useEffect(() => {
    if (activeTab === "field-preferences" && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [fields, activeTab]);

  // SFTP functions
  const saveSftpConfig = async () => {
    setSaving(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await authFetch(
        `${apiBaseUrl}/sftp/config`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sftpConfig),
        },
        session?.access_token
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to save SFTP configuration");
      }

      toast.saved();
    } catch (error) {
      console.error("Error saving SFTP configuration:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save SFTP configuration");
    } finally {
      setSaving(false);
    }
  };

  const testSftpConnection = async () => {
    setSaving(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await authFetch(
        `${apiBaseUrl}/sftp/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sftpConfig),
        },
        session?.access_token
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to test SFTP connection");
      }

      toast.success("SFTP connection test successful!");
    } catch (error) {
      console.error("Error testing SFTP connection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to test SFTP connection");
    } finally {
      setSaving(false);
    }
  };

  // Fetch SFTP config
  useEffect(() => {
    const fetchSftpConfig = async () => {
      if (!session?.user?.id) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", session.user.id)
          .single();

        if (!profile?.school_id) {
          throw new Error("No school ID found");
        }

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
        console.error("Error fetching SFTP config:", error);
      }
    };

    fetchSftpConfig();
  }, [session]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/users`, {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch school record for subscription tab
  useEffect(() => {
    const fetchSchool = async () => {
      if ((activeTab !== "subscription" && activeTab !== "field-preferences") || !session?.user?.id) {
        console.log("Debug - Not fetching school:", {
          activeTab,
          userId: session?.user?.id,
        });
        return;
      }

      setSchoolLoading(true);
      setSchoolError(null);
      try {
        // First fetch the school_id from profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error("Failed to fetch profile");
        }

        if (!profile?.school_id) {
          throw new Error("No school ID found in profile");
        }

        console.log("Debug - School ID from profile:", profile.school_id);

        // Now fetch the school details
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        console.log(
          "Debug - Fetching school from:",
          `${apiBaseUrl}/schools/${profile.school_id}`
        );
        const res = await fetch(`${apiBaseUrl}/schools/${profile.school_id}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        console.log(
          "Debug - School fetch response:",
          res.status,
          res.statusText
        );
        if (!res.ok) throw new Error("Failed to fetch school record");
        const data = await res.json();
        console.log("Debug - School data:", data);
        setSchool(data.school || null);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Error fetching school record";
        console.error("Debug - School fetch error:", err);
        setSchoolError(errorMsg);
        setSchool(null);
      } finally {
        setSchoolLoading(false);
      }
    };
    fetchSchool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, session]);

  useEffect(() => {
    if (activeTab === "user-management" && session?.access_token) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, session]);

  const handleRowClick = (user: UserProfile) => {
    // Convert UserProfile to UserToEdit format
    const userToEdit = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: Array.isArray(user.role) ? user.role : [user.role] as ('admin' | 'recruiter' | 'reviewer')[]
    };
    setSelectedUser(userToEdit);
    setEditModalOpen(true);
  };

  // Stripe Checkout handler
  const handleStripeCheckout = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await authFetch(
        `${apiBaseUrl}/stripe/create-portal-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
        session?.access_token
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to create Stripe portal session");
      }

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (error) {
      console.error("Error creating Stripe portal session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to open billing portal");
    }
  };

  // Update the navigation handler
  const handleTabChange = (tabId: string) => {
    navigate(`/settings/${tabId}`);
  };

  // Add loadFieldPreferences function
  const loadFieldPreferences = async () => {
    if (!session?.user?.id) return;

    try {
      console.log('Loading field preferences for user:', session.user.id);
      const { data: settings, error } = await supabase
        .from('settings')
        .select('preferences, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!settings || settings.length === 0) {
        console.log('No settings found, initializing with defaults');
        setFields([]);
        setInitialFields([]);
        return;
      }

      console.log('Settings data:', settings[0]);
      let cardFields: CardFields = {};
      if (settings[0]?.preferences && settings[0]?.preferences.card_fields) {
        // Only keep canonical fields, and add any missing ones with defaults
        for (const field of CANONICAL_CARD_FIELDS) {
          cardFields[field] = settings[0]?.preferences.card_fields[field] || { enabled: true, required: false };
        }
      } else {
        // If no settings, initialize all canonical fields
        for (const field of CANONICAL_CARD_FIELDS) {
          cardFields[field] = { enabled: true, required: false };
        }
      }
      console.log('Card fields:', cardFields);

      const formattedFields = Object.entries(cardFields).map(([key, value]: [string, any]) => ({
        key,
        label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        visible: value.enabled,
        required: value.required
      }));

      console.log('Formatted fields:', formattedFields);
      setFields(formattedFields);
      setInitialFields(formattedFields);
    } catch (error) {
      console.error('Error loading field preferences:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error(error instanceof Error ? error.message : "Failed to load field preferences");
    } finally {
      setLoadingFields(false);
    }
  };

  // Add handleSave function
  const handleSave = async (updatedFields: CardField[]) => {
    try {
      if (!school?.id) {
        toast.error("School information not found");
        return;
      }

      // Build the card_fields object
      const cardFields = updatedFields.reduce((acc, field) => {
        acc[field.key] = { enabled: field.visible, required: field.required };
        return acc;
      }, {} as Record<string, { enabled: boolean; required: boolean }>);

      const { error } = await supabase
        .from("schools")
        .update({ card_fields: cardFields })
        .eq("id", school.id);

      if (error) throw error;

      setFields(updatedFields);
      setInitialFields(updatedFields);
      toast.saved();
    } catch (error) {
      console.error("Error saving field preferences:", error);
      toast.error("Failed to save field preferences");
    }
  };

  // Add useEffect for loading field preferences
  useEffect(() => {
    if (session?.user?.id && activeTab === 'field-preferences') {
      loadFieldPreferences();
    }
  }, [session, activeTab]);

  // Add loadMajors function
  const loadMajors = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", session.user.id)
        .single();
      if (!profile?.school_id) throw new Error("No school ID found");
      const { data: schoolData } = await supabase
        .from("schools")
        .select("majors")
        .eq("id", profile.school_id)
        .single();
      const majorsArr = schoolData?.majors || [];
      setMajorsList(majorsArr);
      setEditedMajors(majorsArr);
      setMajors(majorsArr.join("\n"));
      setInitialMajors(majorsArr.join("\n"));
    } catch (error) {
      console.error("Error loading majors:", error);
      toast.error("Failed to load majors");
    } finally {
      setLoadingMajors(false);
    }
  };

  // Save majors (from editedMajors or textarea)
  const saveMajors = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", session.user.id)
        .single();
      if (!profile?.school_id) throw new Error("No school ID found");
      let majorsToSave: string[] = [];
      if (showImport) {
        majorsToSave = majors
          .split("\n")
          .map(major => major.trim())
          .filter(major => major.length > 0);
      } else {
        majorsToSave = editedMajors.map(m => m.trim()).filter(m => m.length > 0);
      }
      const { error } = await supabase
        .from("schools")
        .update({ majors: majorsToSave })
        .eq("id", profile.school_id);
      if (error) throw error;
      setMajorsList(majorsToSave);
      setEditedMajors(majorsToSave);
      setMajors(majorsToSave.join("\n"));
      setInitialMajors(majorsToSave.join("\n"));
      setIsDirty(false);
      setShowImport(false);
      setAddMajorInput("");
      toast.success("Majors updated successfully");
    } catch (error) {
      console.error("Error saving majors:", error);
      toast.error("Failed to save majors");
    }
  };

  // Add useEffect for loading majors
  useEffect(() => {
    if (session?.user?.id && activeTab === 'majors') {
      loadMajors();
    }
  }, [session, activeTab]);

  // Add major handler
  const handleAddMajor = () => {
    const newMajor = addMajorInput.trim();
    if (newMajor && !editedMajors.includes(newMajor)) {
      setEditedMajors([newMajor, ...editedMajors]);
      setAddMajorInput("");
      setAddMode(false);
      setIsDirty(true);
      toast.success("New major added");
    }
  };

  // Edit major handler
  const handleEditMajor = (idx: number) => {
    if (editValue.trim() && !editedMajors.includes(editValue.trim())) {
      const newMajors = [...editedMajors];
      newMajors[idx] = editValue.trim();
      setEditedMajors(newMajors);
      setEditIndex(null);
      setEditValue("");
      setIsDirty(true);
      toast.success("Major updated successfully");
    }
  };

  // Delete major handler
  const handleDeleteMajor = (idx: number) => {
    setEditedMajors(editedMajors.filter((_, i) => i !== idx));
    setIsDirty(true);
    toast.success("Major deleted");
  };

  // Dynamic heading and content based on active menu
  let heading = "";
  let content = null;
  switch (activeTab) {
    case "account-settings":
      heading = "Account Settings";
      content = (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school_name">School Name</Label>
              <Input
                id="school_name"
                value={school?.name || ""}
                onChange={(e) => setSchool({ ...school, name: e.target.value })}
                placeholder="Enter your school name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school_email">School Email</Label>
              <Input
                id="school_email"
                type="email"
                value={school?.email || ""}
                onChange={(e) => setSchool({ ...school, email: e.target.value })}
                placeholder="Enter your school email"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => {}} disabled={schoolLoading}>
              {schoolLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      );
      break;
    case "field-preferences":
      heading = "Field Preferences";
      content = (
        <div className="flex flex-col min-h-[80vh]">
          <div className="flex-1 space-y-6">
            {loadingFields ? (
              <div>Loading field preferences...</div>
            ) : (
              <CardFieldPreferences
                fields={fields}
                onFieldsChange={setFields}
              />
            )}
          </div>
          <div className="bg-white border-t z-50 px-4 py-3 flex justify-end shadow-md">
            <Button
              onClick={() => handleSave(fields)}
              disabled={loadingFields || JSON.stringify(fields) === JSON.stringify(initialFields)}
              variant={JSON.stringify(fields) !== JSON.stringify(initialFields) ? "default" : "secondary"}
            >
              Save Changes
            </Button>
          </div>
        </div>
      );
      break;
    case "majors":
      heading = "Majors";
      if (loadingMajors) {
        content = <div>Loading majors...</div>;
        break;
      }
      if (showImport || majorsList.length === 0) {
        content = (
          <Card>
            <CardHeader>
              <CardTitle>Manage Available Majors</CardTitle>
              <CardDescription>
                Paste in a list of majors offered at your school. Gemini will use this list to help match student responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="majors" className="text-sm font-medium">Majors (one per line)</Label>
              <Textarea
                id="majors"
                value={majors}
                onChange={e => {
                  setMajors(e.target.value);
                  setIsDirty(e.target.value !== initialMajors);
                }}
                placeholder={`Biology\nComputer Science\nBusiness Administration\nMechanical Engineering`}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground font-normal">
                Paste or type one major per line. We'll automatically match students' responses to the closest major from this list.
              </p>
              <div className="flex justify-start">
                <Button
                  onClick={saveMajors}
                  disabled={!majors.trim() || majors === initialMajors || !isDirty}
                >
                  Save Majors
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        break;
      }
      // Dynamic majors management UI
      content = (
        <div className="space-y-2">
          <Card className="shadow-sm rounded-xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Manage Majors</CardTitle>
              <button
                className="text-primary hover:bg-muted rounded-full p-1 transition"
                onClick={() => {
                  setAddMode(true);
                  setAddMajorInput("");
                }}
                aria-label="Add major"
                type="button"
              >
                <Plus className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search majors..."
                className="mb-2"
              />
              <div className="max-h-[500px] overflow-y-auto rounded-md border border-muted-foreground/10 bg-muted/50 divide-y divide-muted-foreground/10">
                {/* Add mode input */}
                {addMode && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/80 sticky top-0 z-10">
                    <Input
                      autoFocus
                      value={addMajorInput}
                      onChange={e => setAddMajorInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleAddMajor();
                        if (e.key === "Escape") setAddMode(false);
                      }}
                      placeholder="Enter new major..."
                      className="flex-1 border-none bg-transparent px-0 py-0 text-base font-normal focus:ring-0 focus-visible:ring-0 focus:outline-none shadow-none"
                    />
                    <button
                      className="text-green-600 hover:bg-green-100 rounded-full p-1"
                      onClick={handleAddMajor}
                      type="button"
                      aria-label="Confirm add major"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      className="text-muted-foreground hover:bg-muted rounded-full p-1"
                      onClick={() => setAddMode(false)}
                      type="button"
                      aria-label="Cancel add major"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {editedMajors
                  .filter(m => m.toLowerCase().includes(search.toLowerCase()))
                  .map((major, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 group hover:bg-muted/80 transition">
                      {editIndex === idx ? (
                        <>
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleEditMajor(idx);
                              if (e.key === "Escape") {
                                setEditIndex(null);
                                setEditValue("");
                              }
                            }}
                            className="flex-1 border-none bg-transparent px-0 py-0 text-base font-normal focus:ring-0 focus-visible:ring-0 focus:outline-none shadow-none"
                          />
                          <button
                            className="text-green-600 hover:bg-green-100 rounded-full p-1"
                            onClick={() => handleEditMajor(idx)}
                            type="button"
                            aria-label="Save major"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            className="text-muted-foreground hover:bg-muted rounded-full p-1"
                            onClick={() => {
                              setEditIndex(null);
                              setEditValue("");
                            }}
                            type="button"
                            aria-label="Cancel edit major"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 truncate text-base font-normal">{major}</span>
                          <button
                            className="text-primary hover:bg-muted rounded-full p-1"
                            onClick={() => {
                              setEditIndex(idx);
                              setEditValue(major);
                            }}
                            type="button"
                            aria-label="Edit major"
                          >
                            <PencilLine className="w-4 h-4" />
                          </button>
                          <button
                            className="text-destructive hover:bg-destructive/10 rounded-full p-1"
                            onClick={() => handleDeleteMajor(idx)}
                            type="button"
                            aria-label="Delete major"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                {editedMajors.filter(m => m.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <div className="text-xs text-muted-foreground px-3 py-4 text-center">No majors found.</div>
                )}
              </div>
              {/* Sticky Save Button */}
              {isDirty && (
                <div className="sticky bottom-0 left-0 w-full flex justify-end pt-4 bg-gradient-to-t from-white via-white/80 to-transparent z-10">
                  <Button
                    onClick={saveMajors}
                    className="shadow-md"
                    variant="default"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
      break;
    case "user-management":
      heading = "Manage Users";
      content = (
        <Card className="bg-white shadow-sm rounded-xl p-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <div>
                <div className="text-2xl font-semibold">Manage Users</div>
                <div className="text-muted-foreground text-sm mb-4">
                  User Management
                </div>
              </div>
              <Button
                onClick={() => setInviteDialogOpen(true)}
                className="self-start sm:self-auto"
              >
                Invite User
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5 py-4">Name</TableHead>
                    <TableHead className="px-5 py-4">Email</TableHead>
                    <TableHead className="px-5 py-4 text-center">
                      Role
                    </TableHead>
                    <TableHead className="px-5 py-4 text-right">
                      Last Login
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-sm text-gray-500"
                      >
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-sm text-gray-500"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        onClick={() => handleRowClick(user)}
                        className={`cursor-pointer transition hover:bg-muted ${
                          idx % 2 === 1 ? "bg-muted/50" : ""
                        }`}
                      >
                        <TableCell className="px-5 py-4">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {user.email}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          {Array.isArray(user.role) ? user.role.join(', ') : user.role}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right">
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <InviteUserDialog
              open={inviteDialogOpen}
              onOpenChange={setInviteDialogOpen}
              onSuccess={fetchUsers}
            />
            <EditUserModal
              open={editModalOpen}
              onOpenChange={setEditModalOpen}
              user={selectedUser}
              onSuccess={fetchUsers}
            />
          </CardContent>
        </Card>
      );
      break;
    case "subscription":
      heading = "Subscription";
      content = (
        <Card className="bg-white shadow-sm rounded-xl p-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <div>
                <div className="text-2xl font-semibold">Subscription Details</div>
                <div className="text-muted-foreground text-sm mb-4">
                  Manage your billing plan and payment details
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {schoolLoading ? (
                <div className="text-muted-foreground text-sm py-8">Loading plan details...</div>
              ) : schoolError ? (
                <div className="text-red-500 text-sm py-8">{schoolError}</div>
              ) : school ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{school.name} Plan</p>
                      <p className="text-sm text-muted-foreground">
                        {PRICING_DISPLAY[school.name] || "N/A"}
                      </p>
                    </div>
                    <Button
                      onClick={handleStripeCheckout}
                      size="default"
                      disabled={schoolLoading || !!schoolError || !school}
                    >
                      Manage Subscription
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You're currently on the <strong className="capitalize">{school.name}</strong> plan, billed annually.
                  </p>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm py-8">No school record found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      );
      break;
    case "integrations":
      heading = "Integrations";
      content = (
        <Card>
          <CardHeader>
            <CardTitle>Slate Integration (SFTP)</CardTitle>
            <CardDescription>
              Enter your Slate SFTP credentials to enable export.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          <CardFooter className="justify-end space-x-2">
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
        </Card>
      );
      break;
    default:
      heading = "Account Settings";
      content = <SettingsPreferences />;
      break;
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Mobile Navigation - Horizontal scroll */}
        <div className="lg:hidden">
          <div className="flex overflow-x-auto space-x-2 pb-2 mb-6">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap min-w-fit ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted bg-white border"
                }`}
              >
                <span className="w-4 h-4 mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Navigation - Vertical */}
        <div className="hidden lg:block w-64 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{heading}</h1>
          {content}
        </div>
      </div>

      {/* Modals */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={fetchUsers}
      />
      {selectedUser && (
        <EditUserModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          user={selectedUser}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};

export default AdminSettings;
