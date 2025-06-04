import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authFetch } from "@/lib/authFetch";
import { useAuth } from "@/contexts/AuthContext";
import { InviteUserDialog } from "./InviteUserDialog";
import { EditUserModal } from "./EditUserModal";
import { Button } from "./ui/button";
import { useLoader, TableLoader } from "@/contexts/LoaderContext";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string | string[];
  last_sign_in_at?: string | null;
  school_id?: string;
}

// Add this interface for the edit modal user type
interface UserToEdit {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ("admin" | "recruiter" | "reviewer")[];
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserToEdit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { session } = useAuth();

  // Use global loader instead of local loading state
  const { showTableLoader, hideTableLoader, isLoading } = useLoader();
  const LOADER_ID = "user-management-table";

  const fetchUsers = async () => {
    showTableLoader(LOADER_ID, "Loading users...");
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await authFetch(
        `${apiBaseUrl}/users`,
        {},
        session?.access_token
      );
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      hideTableLoader(LOADER_ID);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: UserProfile) => {
    // Transform user to match EditUserModal expectations
    const userToEdit = {
      ...user,
      role: Array.isArray(user.role)
        ? user.role.filter((r): r is "admin" | "recruiter" | "reviewer" =>
            ["admin", "recruiter", "reviewer"].includes(r)
          )
        : [user.role].filter((r): r is "admin" | "recruiter" | "reviewer" =>
            ["admin", "recruiter", "reviewer"].includes(r)
          ),
    };
    setSelectedUser(userToEdit);
    setIsEditModalOpen(true);
  };

  const handleEditModalSave = () => {
    fetchUsers(); // Refresh the users list
    setSelectedUser(null);
    setIsEditModalOpen(false);
  };

  const handleInviteUser = () => {
    setIsInviteDialogOpen(true);
  };

  const handleInviteDialogSave = () => {
    fetchUsers(); // Refresh the users list
    setIsInviteDialogOpen(false);
  };

  const formatRole = (role: string | string[]) => {
    if (Array.isArray(role)) {
      return role.join(", ");
    }
    return role;
  };

  const filterActiveUsers = (user: UserProfile) => {
    // Filter out users who haven't signed in (invited but not yet active)
    return user.last_sign_in_at !== null;
  };

  const activeUsers = users.filter(filterActiveUsers);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={handleInviteUser}>Invite User</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableLoader id={LOADER_ID} rowCount={5} colCount={5} />
            {!isLoading(LOADER_ID) && activeUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No active users found
                </TableCell>
              </TableRow>
            )}
            {!isLoading(LOADER_ID) &&
              activeUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{formatRole(user.role)}</TableCell>
                  <TableCell>
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <EditUserModal
        user={selectedUser}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditModalSave}
      />

      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSuccess={handleInviteDialogSave}
      />
    </div>
  );
};

export default UserManagement;
