import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
import {
  User,
  CreditCard,
  Settings,
  ListFilter,
  Users,
  Database,
  GraduationCap,
  Trash2,
  Plus,
  PencilLine,
  Check,
  X,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { SchoolService } from "@/services/SchoolService";
import SettingsPreferences from "./SettingsPreferences";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { updateSchoolCardFields } from "@/lib/api";
import { CardFieldPreferences } from "@/components/CardFieldPreferences";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserService } from "@/services/UserService";
import { IntegrationsService } from "@/services/IntegrationsService";
import { Textarea } from "@/components/ui/textarea";
import {
  useLoader,
  TableLoader,
  InlineLoader,
  OverlayLoader,
} from "@/contexts/LoaderContext";
import { useProfile } from "@/hooks/useProfile";
import { useSchool } from "@/hooks/useSchool";
import { UserManagementSection } from "./AdminSettings/UserManagementSection";
import { IntegrationsSection } from "./AdminSettings/IntegrationsSection";
import { MajorsSection } from "./AdminSettings/MajorsSection";
import { SubscriptionSection } from "./AdminSettings/SubscriptionSection";
import { UserProfile } from "@/api/backend/users";

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
  role: ("admin" | "recruiter" | "reviewer")[];
}

interface SchoolRecord {
  id: string;
  name: string;
  email: string;
  stripe_customer_id: string | null;
  created_at: string;
  card_fields?: Record<string, { enabled: boolean; required: boolean }>;
}

interface SFTPConfig {
  school_id: string;
  host: string;
  username: string;
  password: string;
  remote_path: string;
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

// Add canonical field definitions
const CANONICAL_CARD_FIELDS = [
  "name",
  "preferred_first_name",
  "date_of_birth",
  "email",
  "cell",
  "permission_to_text",
  "address",
  "city",
  "state",
  "zip_code",
  "high_school",
  "class_rank",
  "students_in_class",
  "gpa",
  "student_type",
  "entry_term",
  "major",
  "gender",
  // Note: city_state and other combined fields are now filtered out during processing
  // and should not be included in new school configurations
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
  const activeTab = location.pathname.split("/").pop() || "account-settings";

  // Use shared hooks
  const { profile, schoolId, loading: profileLoading } = useProfile();
  const {
    school,
    loading: schoolLoading,
    error: schoolError,
    updateSchool,
  } = useSchool(schoolId || undefined);

  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserToEdit | null>(null);

  // School state for subscription tab
  const [isSchoolNameDirty, setIsSchoolNameDirty] = useState(false);
  const [initialSchoolName, setInitialSchoolName] = useState<string>("");
  const [schoolNameInput, setSchoolNameInput] = useState<string>("");

  // SFTP state
  const [sftpConfig, setSftpConfig] = useState<SFTPConfig>({
    host: "",
    username: "",
    password: "",
    remote_path: "",
    school_id: schoolId || "",
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
  const [showImport, setShowImport] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [initialMajors, setInitialMajors] = useState<string>("");
  const [loadingMajors, setLoadingMajors] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addMajorsInput, setAddMajorsInput] = useState("");

  // Scroll to top when fields are updated after a save (field-preferences tab only)
  useEffect(() => {
    if (activeTab === "field-preferences" && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [fields, activeTab]);

  // Fetch SFTP config
  useEffect(() => {
    const fetchSftpConfig = async () => {
      if (!schoolId) return;

      try {
        const sftpData = await IntegrationsService.getSftpConfig(schoolId);
        if (sftpData) {
          setSftpConfig(sftpData);
        }
      } catch (error) {
        console.error("Error fetching SFTP config:", error);
      }
    };

    fetchSftpConfig();
  }, [schoolId]);

  // Set initial school name when school data is loaded
  useEffect(() => {
    if (school?.name && !initialSchoolName) {
      setInitialSchoolName(school.name);
      setSchoolNameInput(school.name);
    }
  }, [school?.name, initialSchoolName]);

  useEffect(() => {
    if (activeTab === "user-management" && session?.access_token) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, session]);

  // Call loadFieldPreferences when school changes and activeTab is 'field-preferences'
  useEffect(() => {
    if (school && activeTab === "field-preferences") {
      loadFieldPreferences();
    }
  }, [school, activeTab]);

  // Add useEffect for loading majors
  useEffect(() => {
    if (schoolId && activeTab === "majors") {
      loadMajors();
    }
  }, [schoolId, activeTab, profileLoading]);

  // If we're at /settings, redirect to /settings/account-settings
  if (location.pathname === "/settings") {
    return <Navigate to="/settings/account-settings" replace />;
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await UserService.getAllUsers(session?.access_token);
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (user: UserProfile) => {
    // Convert UserProfile to UserToEdit format
    const userToEdit = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: Array.isArray(user.role)
        ? user.role.filter((r): r is "admin" | "recruiter" | "reviewer" =>
            ["admin", "recruiter", "reviewer"].includes(r)
          )
        : [user.role].filter((r): r is "admin" | "recruiter" | "reviewer" =>
            ["admin", "recruiter", "reviewer"].includes(r)
          ),
    };
    setSelectedUser(userToEdit);
    setEditModalOpen(true);
  };

  // Stripe Checkout handler
  const handleStripeCheckout = async () => {
    try {
      const portalUrl = await IntegrationsService.createStripePortalSession(
        session?.access_token
      );
      window.open(portalUrl, "_blank");
    } catch (error) {
      console.error("Error creating Stripe portal session:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to open billing portal"
      );
    }
  };

  // Update the navigation handler
  const handleTabChange = (tabId: string) => {
    navigate(`/settings/${tabId}`);
  };

  // SFTP functions
  const saveSftpConfig = async () => {
    setSaving(true);
    try {
      await IntegrationsService.saveSftpConfig(
        { ...sftpConfig, school_id: schoolId },
        session?.access_token
      );
      toast.saved();
    } catch (error) {
      console.error("Error saving SFTP configuration:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save SFTP configuration"
      );
    } finally {
      setSaving(false);
    }
  };

  const testSftpConnection = async () => {
    setSaving(true);
    try {
      await IntegrationsService.testSftpConnection(
        sftpConfig,
        session?.access_token
      );
      toast.success("SFTP connection test successful!");
    } catch (error) {
      console.error("Error testing SFTP connection:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to test SFTP connection"
      );
    } finally {
      setSaving(false);
    }
  };

  // Add loadFieldPreferences function
  const loadFieldPreferences = async () => {
    if (!school?.card_fields) {
      setFields([]);
      setInitialFields([]);
      setLoadingFields(false);
      return;
    }

    // Handle both array and object formats for backward compatibility
    let cardFieldsArray: Array<{
      key: string;
      enabled: boolean;
      required: boolean;
    }>;

    if (Array.isArray(school.card_fields)) {
      // New format: array of objects
      cardFieldsArray = school.card_fields as Array<{
        key: string;
        enabled: boolean;
        required: boolean;
      }>;
    } else {
      // Legacy format: object with string keys
      const cardFieldsObj = school.card_fields as Record<
        string,
        { enabled: boolean; required: boolean }
      >;
      cardFieldsArray = Object.entries(cardFieldsObj).map(([key, field]) => ({
        key,
        enabled: field.enabled,
        required: field.required,
      }));
    }

    const formattedFields = cardFieldsArray.map((field) => {
      return {
        key: field.key,
        label: field.key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        visible: field.enabled,
        required: field.required,
      };
    });
    setFields(formattedFields);
    setInitialFields(formattedFields);
    setLoadingFields(false);
  };

  // Add handleSave function
  const handleSave = async (updatedFields: CardField[]) => {
    try {
      if (!school?.id) {
        toast.error("School information not found");
        return;
      }

      // Build the card_fields array
      const cardFields = updatedFields.map((field) => ({
        key: field.key,
        enabled: field.visible,
        required: field.required,
      }));

      await SchoolService.updateCardFields(
        school.id,
        cardFields.map((field) => ({
          key: field.key,
          label: field.key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          visible: field.enabled,
          required: field.required,
        }))
      );

      setFields(updatedFields);
      setInitialFields(updatedFields);
      toast.saved();
    } catch (error) {
      console.error("Error saving field preferences:", error);
      toast.error("Failed to save field preferences");
    }
  };

  // Add loadMajors function
  const loadMajors = async () => {
    if (!schoolId) {
      setLoadingMajors(false);
      return;
    }
    try {
      const majorsArr = await SchoolService.getMajors(schoolId);
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
  const saveMajors = async (majorsOverride?: string[]) => {
    if (!session?.user?.id || !schoolId) return;
    try {
      // Helper function to clean majors array
      const cleanMajors = (majorsList: string[]): string[] =>
        majorsList.map((m) => m.trim()).filter((m) => m.length > 0);

      // Determine source of majors based on current flow
      let rawMajors: string[];
      if (showImport) {
        rawMajors = majors.split("\n");
      } else if (majorsOverride) {
        rawMajors = majorsOverride;
      } else if (majorsList.length === 0) {
        // Initial state: use textarea content
        rawMajors = majors.split("\n");
      } else {
        rawMajors = editedMajors;
      }

      const majorsToSave = cleanMajors(rawMajors);

      await SchoolService.updateMajors(schoolId, majorsToSave);

      // Update all related state
      setMajorsList(majorsToSave);
      setEditedMajors(majorsToSave);
      setMajors(majorsToSave.join("\n"));
      setInitialMajors(majorsToSave.join("\n"));
      setIsDirty(false);
      setShowImport(false);
      toast.success("Majors updated successfully");
    } catch (error) {
      console.error("Error saving majors:", error);
      toast.error("Failed to save majors");
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
      saveMajors(newMajors);
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
                value={schoolNameInput}
                onChange={(e) => {
                  setSchoolNameInput(e.target.value);
                  setIsSchoolNameDirty(e.target.value !== initialSchoolName);
                }}
                placeholder="Enter your school name"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              onClick={async () => {
                if (!school?.id) return;
                try {
                  await updateSchool({ name: schoolNameInput });
                  setInitialSchoolName(schoolNameInput);
                  setIsSchoolNameDirty(false);
                  toast.saved();
                } catch (error) {
                  console.error("Error updating school:", error);
                  toast.error("Failed to save account settings");
                }
              }}
              disabled={schoolLoading || !isSchoolNameDirty}
            >
              {schoolLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      );
      break;
    case "field-preferences":
      heading = "Field Preferences";
      console.log("[AdminSettings] Rendering field-preferences tab:", {
        loadingFields,
        fieldsLength: fields.length,
        activeTab,
        schoolId: school?.id,
      });
      content = (
        <div className="space-y-6">
          {loadingFields ? (
            <div>Loading field preferences...</div>
          ) : (
            <CardFieldPreferences
              fields={fields}
              onFieldsChange={setFields}
            />
          )}
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => handleSave(fields)}
              disabled={
                loadingFields ||
                JSON.stringify(fields) === JSON.stringify(initialFields)
              }
              variant={
                JSON.stringify(fields) !== JSON.stringify(initialFields)
                  ? "default"
                  : "secondary"
              }
            >
              Save Changes
            </Button>
          </div>
        </div>
      );
      break;
    case "majors":
      heading = "Majors";
      content = (
        <MajorsSection
          majorsList={majorsList}
          editedMajors={editedMajors}
          setEditedMajors={setEditedMajors}
          search={search}
          setSearch={setSearch}
          showImport={showImport}
          setShowImport={setShowImport}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
          editIndex={editIndex}
          setEditIndex={setEditIndex}
          editValue={editValue}
          setEditValue={setEditValue}
          addMajorsInput={addMajorsInput}
          setAddMajorsInput={setAddMajorsInput}
          saveMajors={saveMajors}
          loadingMajors={loadingMajors}
        />
      );
      break;
    case "user-management":
      heading = "Manage Users";
      content = (
        <UserManagementSection
          users={users}
          loading={loading}
          inviteDialogOpen={inviteDialogOpen}
          setInviteDialogOpen={setInviteDialogOpen}
          editModalOpen={editModalOpen}
          setEditModalOpen={setEditModalOpen}
          selectedUser={selectedUser}
          handleRowClick={handleRowClick}
          fetchUsers={fetchUsers}
        />
      );
      break;
    case "subscription":
      heading = "Subscription";
      content = (
        <SubscriptionSection
          school={school}
          schoolLoading={schoolLoading}
          schoolError={schoolError}
          handleStripeCheckout={handleStripeCheckout}
        />
      );
      break;
    case "integrations":
      heading = "Integrations";
      content = (
        <IntegrationsSection
          sftpConfig={sftpConfig}
          setSftpConfig={setSftpConfig}
          saving={saving}
          saveSftpConfig={saveSftpConfig}
          testSftpConnection={testSftpConnection}
        />
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
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
            {heading}
          </h1>
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
