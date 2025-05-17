import React, { useState, useEffect } from "react";
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
import { User, CreditCard, Settings } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabaseClient";
import SettingsPreferences from "./SettingsPreferences";

const NAV_ITEMS = [
  {
    key: "account",
    label: "Account Settings",
    icon: <Settings className="w-5 h-5 mr-2" />,
  },
  {
    key: "users",
    label: "Manage Users",
    icon: <span className="mr-2">👥</span>,
  },
  {
    key: "subscription",
    label: "Manage Subscription",
    icon: <span className="mr-2">💳</span>,
  },
];

const PRICING_DISPLAY: Record<string, string> = {
  starter: "$5,000/year",
  professional: "$7,500/year",
  enterprise: "Custom pricing",
};

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
  pricing_tier: string;
  stripe_price_id: string;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

const AdminSettings: React.FC = () => {
  const [active, setActive] = useState("account");

  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { session, user } = useAuth();

  // School state for subscription tab
  const [school, setSchool] = useState<SchoolRecord | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);

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
      if (active !== "subscription" || !session?.user?.id) {
        console.log("Debug - Not fetching school:", {
          active,
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
  }, [active, session]);

  useEffect(() => {
    if (active === "users" && session?.access_token) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, session]);

  const handleRowClick = (user: UserProfile) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  // Stripe Checkout handler
  const handleStripeCheckout = async () => {
    if (!school?.stripe_price_id) {
      alert("No Stripe price ID found for your school.");
      return;
    }
    const stripe = await stripePromise;
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const res = await fetch(`${apiBaseUrl}/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price_id: school.stripe_price_id,
        success_url: window.location.origin + "/settings?checkout=success",
        cancel_url: window.location.origin + "/settings?checkout=cancel",
        customer_email: session?.user?.email,
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Stripe error: " + data.error);
    }
  };

  // Dynamic heading and content based on active menu
  let heading = "";
  let content = null;
  switch (active) {
    case "account":
      heading = "Account Settings";
      content = <SettingsPreferences />;
      break;
    case "users":
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
                          {user.role}
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
    default:
      heading = "Manage Subscription";
      content = (
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>
              Control your billing plan and payment details below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-6 py-4">
            {schoolLoading ? (
              <div className="text-muted-foreground text-sm py-8">Loading plan details...</div>
            ) : schoolError ? (
              <div className="text-red-500 text-sm py-8">{schoolError}</div>
            ) : school ? (
              <>
                <div className="text-sm">
                  <span className="font-medium capitalize">{school.pricing_tier} Plan</span>
                  <span className="ml-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {PRICING_DISPLAY[school.pricing_tier] || "N/A"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You're currently on the <strong className="capitalize">{school.pricing_tier}</strong> plan, billed annually.
                </p>
              </>
            ) : (
              <div className="text-muted-foreground text-sm py-8">No school record found.</div>
            )}
          </CardContent>
          <CardFooter className="px-6 pb-4">
            <Button
              onClick={handleStripeCheckout}
              className="w-full sm:w-auto"
              size="default"
              disabled={schoolLoading || !!schoolError || !school}
            >
              Subscribe with Stripe
            </Button>
          </CardFooter>
        </Card>
      );
      break;
  }

  return (
    <div className="flex h-full min-h-screen w-full">
      {/* Left nav */}
      <div className="w-64 border-r bg-muted/50 px-2 py-6 flex flex-col gap-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`
              flex items-center w-full px-4 py-2 rounded-lg transition font-medium
              ${
                active === item.key
                  ? "bg-blue-100 text-blue-800 font-semibold"
                  : "hover:bg-muted/70 text-gray-700"
              }
            `}
            aria-current={active === item.key ? "page" : undefined}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 px-6 py-6 space-y-6">
        <div className="max-w-xl w-full">
          {content}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
