import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InviteUserDialog } from "../InviteUserDialog";
import { EditUserModal } from "../EditUserModal";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  last_sign_in_at?: string | null;
  school_id?: string;
}

interface UserToEdit {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ("admin" | "recruiter" | "reviewer")[];
}

interface UserManagementSectionProps {
  users: UserProfile[];
  loading: boolean;
  inviteDialogOpen: boolean;
  setInviteDialogOpen: (open: boolean) => void;
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  selectedUser: UserToEdit | null;
  handleRowClick: (user: UserProfile) => void;
  fetchUsers: () => void;
}

const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  users,
  loading,
  inviteDialogOpen,
  setInviteDialogOpen,
  editModalOpen,
  setEditModalOpen,
  selectedUser,
  handleRowClick,
  fetchUsers,
}) => {
  return (
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
                <TableHead className="px-5 py-4 text-center">Role</TableHead>
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
                    <TableCell className="px-5 py-4">{user.email}</TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      {Array.isArray(user.role)
                        ? user.role.join(", ")
                        : user.role}
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
};

export default memo(UserManagementSection);
export { UserManagementSection };
