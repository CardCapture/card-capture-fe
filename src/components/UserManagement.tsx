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

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string | string[];
  last_sign_in_at?: string | null;
  school_id?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { session, profile } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await authFetch(
        `${apiBaseUrl}/users`,
        {},
        session?.access_token
      );
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchUsers();
    }
  }, [session]);

  const handleRowClick = (user: UserProfile) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  // Filter users to only those with the same school_id as the current user
  const filteredUsers = users.filter(
    (user: UserProfile) => user.school_id === profile?.school_id
  );

  return (
    <div className="w-full max-w-4xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setInviteDialogOpen(true)}>Invite User</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Login</TableHead>
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
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-sm text-gray-500"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => handleRowClick(user)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <TableCell>
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {Array.isArray(user.role)
                      ? user.role.join(", ")
                      : user.role}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "2-digit", year: "numeric" }
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
        user={
          selectedUser
            ? {
                ...selectedUser,
                role: Array.isArray(selectedUser.role)
                  ? selectedUser.role.filter(
                      (r): r is "admin" | "recruiter" | "reviewer" =>
                        ["admin", "recruiter", "reviewer"].includes(r)
                    )
                  : [selectedUser.role].filter(
                      (r): r is "admin" | "recruiter" | "reviewer" =>
                        ["admin", "recruiter", "reviewer"].includes(r)
                    ),
              }
            : null
        }
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default UserManagement;
