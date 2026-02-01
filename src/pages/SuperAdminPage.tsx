import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Plus, UserPlus, Settings, LogOut, Users, Calendar, CreditCard, BarChart3, TrendingUp } from "lucide-react";
import { toast } from "@/lib/toast";
import { superAdminApi, type School, type PlatformStats } from "@/lib/superAdminApi";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from '@/utils/logger';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface NewSchoolForm {
  name: string;
  docai_processor_id: string;
}

// Helper function to merge multiple time series into one dataset for charts
function mergeTimeSeriesData(
  students: { date: string; count: number }[],
  cards: { date: string; count: number }[],
  events: { date: string; count: number }[]
) {
  const dateMap = new Map<
    string,
    { date: string; students: number; cards: number; events: number }
  >();

  // Get all unique dates
  const allDates = new Set<string>();
  students.forEach((d) => allDates.add(d.date));
  cards.forEach((d) => allDates.add(d.date));
  events.forEach((d) => allDates.add(d.date));

  // Initialize all dates with zero values
  allDates.forEach((date) => {
    dateMap.set(date, { date, students: 0, cards: 0, events: 0 });
  });

  // Fill in actual values
  students.forEach((d) => {
    const entry = dateMap.get(d.date);
    if (entry) entry.students = d.count;
  });

  cards.forEach((d) => {
    const entry = dateMap.get(d.date);
    if (entry) entry.cards = d.count;
  });

  events.forEach((d) => {
    const entry = dateMap.get(d.date);
    if (entry) entry.events = d.count;
  });

  // Sort by date and return
  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

interface InviteUserForm {
  email: string;
  first_name: string;
  last_name: string;
}

const SuperAdminPage: React.FC = () => {
  const { session, signOut } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Modal states
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false);
  const [selectedSchoolForInvite, setSelectedSchoolForInvite] =
    useState<School | null>(null);

  // Form states
  const [newSchoolForm, setNewSchoolForm] = useState<NewSchoolForm>({
    name: "",
    docai_processor_id: "",
  });
  const [inviteUserForm, setInviteUserForm] = useState<InviteUserForm>({
    email: "",
    first_name: "",
    last_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch schools with user counts
  const fetchSchools = async () => {
    try {
      setLoading(true);
      const schools = await superAdminApi.getSchools();
      setSchools(schools);
    } catch (error) {
      logger.error("Error fetching schools:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch schools"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch platform stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const platformStats = await superAdminApi.getStats();
      setStats(platformStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Don't show toast for stats error - it's not critical
    } finally {
      setStatsLoading(false);
    }
  };

  // Create new school
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolForm.name.trim()) {
      toast.error("School name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await superAdminApi.createSchool({
        name: newSchoolForm.name.trim(),
        docai_processor_id:
          newSchoolForm.docai_processor_id.trim() || undefined,
      });

      toast.success("School created successfully");
      setNewSchoolForm({ name: "", docai_processor_id: "" });
      setIsAddSchoolModalOpen(false);
      fetchSchools();
    } catch (error) {
      logger.error("Error creating school:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create school"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create invitation via SuperAdmin API endpoint
  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolForInvite || !inviteUserForm.email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await superAdminApi.inviteAdmin(
        selectedSchoolForInvite.id,
        {
          email: inviteUserForm.email.trim(),
          first_name: inviteUserForm.first_name.trim() || undefined,
          last_name: inviteUserForm.last_name.trim() || undefined,
        }
      );

      toast.success(
        `${result.message} They will be automatically assigned to ${result.school_name} as an admin.`
      );

      setInviteUserForm({ email: "", first_name: "", last_name: "" });
      setIsInviteUserModalOpen(false);
      setSelectedSchoolForInvite(null);
      fetchSchools();
    } catch (error) {
      logger.error("Error creating invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create invitation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open invite modal for specific school
  const handleOpenInviteModal = (school: School) => {
    setSelectedSchoolForInvite(school);
    setIsInviteUserModalOpen(true);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      logger.error("Error during logout:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading schools...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage schools and administrators
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsAddSchoolModalOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add School
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Platform Analytics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Platform Analytics
          </h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "..." : stats?.total_students ?? 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Schools</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "..." : stats?.total_schools ?? 0}
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Events</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "..." : stats?.total_events ?? 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cards</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "..." : stats?.total_cards ?? 0}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Activity Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Activity Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.students_over_time.length > 0 ||
                  stats.cards_over_time.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart
                        data={mergeTimeSeriesData(
                          stats.students_over_time,
                          stats.cards_over_time,
                          stats.events_over_time
                        )}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) =>
                            new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          labelFormatter={(value) =>
                            new Date(value).toLocaleDateString()
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="students"
                          stroke="#3b82f6"
                          name="Students"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="cards"
                          stroke="#f97316"
                          name="Cards"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="events"
                          stroke="#8b5cf6"
                          name="Events"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-500">
                      No activity data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Schools Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Activity by School
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.schools_breakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.schools_breakdown.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="school_name"
                          tick={{ fontSize: 10 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar
                          dataKey="students"
                          fill="#3b82f6"
                          name="Students"
                        />
                        <Bar dataKey="cards" fill="#f97316" name="Cards" />
                        <Bar dataKey="events" fill="#8b5cf6" name="Events" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-500">
                      No school data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <Card key={school.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {school.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Users:</span>
                    <Badge variant="outline">
                      {school.user_count || 0} user
                      {school.user_count !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Processor ID:</span>
                    <span className="text-sm font-mono text-gray-800">
                      {school.docai_processor_id || "Not set"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm text-gray-800">
                      {new Date(school.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handleOpenInviteModal(school)}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {schools.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No schools yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first school to get started
            </p>
            <Button
              onClick={() => setIsAddSchoolModalOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add School
            </Button>
          </div>
        )}
      </div>

      {/* Add School Modal */}
      <Dialog
        open={isAddSchoolModalOpen}
        onOpenChange={setIsAddSchoolModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New School</DialogTitle>
            <DialogDescription>
              Create a new school that can be managed by administrators.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSchool} className="space-y-4">
            <div>
              <Label htmlFor="school-name">School Name *</Label>
              <Input
                id="school-name"
                value={newSchoolForm.name}
                onChange={(e) =>
                  setNewSchoolForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter school name"
                required
              />
            </div>
            <div>
              <Label htmlFor="processor-id">DocAI Processor ID</Label>
              <Input
                id="processor-id"
                value={newSchoolForm.docai_processor_id}
                onChange={(e) =>
                  setNewSchoolForm((prev) => ({
                    ...prev,
                    docai_processor_id: e.target.value,
                  }))
                }
                placeholder="Enter processor ID (optional)"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddSchoolModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !newSchoolForm.name.trim()}
              >
                {isSubmitting ? "Creating..." : "Create School"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Admin Modal */}
      <Dialog
        open={isInviteUserModalOpen}
        onOpenChange={setIsInviteUserModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite School Administrator</DialogTitle>
            <DialogDescription>
              Send an invitation to become an admin for{" "}
              {selectedSchoolForInvite?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteAdmin} className="space-y-4">
            <div>
              <Label htmlFor="user-email">Email Address *</Label>
              <Input
                id="user-email"
                type="email"
                value={inviteUserForm.email}
                onChange={(e) =>
                  setInviteUserForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="admin@school.edu"
                required
              />
            </div>
            <div>
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={inviteUserForm.first_name}
                onChange={(e) =>
                  setInviteUserForm((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={inviteUserForm.last_name}
                onChange={(e) =>
                  setInviteUserForm((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
                placeholder="Doe"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteUserModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !inviteUserForm.email.trim()}
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminPage;
