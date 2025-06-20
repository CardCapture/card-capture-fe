import React, { memo, useState, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { InviteUserDialog } from "../InviteUserDialog";
import { EditUserModal } from "../EditUserModal";
import { UserProfile } from "@/api/backend/users";
import { useBulkUserSelection } from "@/hooks/useBulkUserSelection";
import { UserService } from "@/services/UserService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/toast";
import { Trash2, X, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserToEdit {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ("admin" | "recruiter" | "reviewer")[];
}

interface UserManagementSectionProps {
  users: UserProfile[];
  setUsers: (users: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => void;
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
  setUsers,
  loading,
  inviteDialogOpen,
  setInviteDialogOpen,
  editModalOpen,
  setEditModalOpen,
  selectedUser,
  handleRowClick,
  fetchUsers,
}) => {
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showIndividualDeleteConfirm, setShowIndividualDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Helper functions for user status
  const isCurrentUser = (user: UserProfile) => user.email === session?.user?.email;
  const isPendingInvite = (user: UserProfile) => !user.last_sign_in_at;
  const isActiveUser = (user: UserProfile) => !!user.last_sign_in_at;

  // Calculate user statistics
  const activeUsersCount = users.filter(isActiveUser).length;
  const pendingInvitesCount = users.filter(isPendingInvite).length;
  const totalUsers = users.length;

  // Bulk selection
  const bulkSelection = useBulkUserSelection(filteredUsers);

  // Bulk delete with optimistic UI updates (Option 1)
  const handleBulkDelete = useCallback(async () => {
    if (bulkSelection.selectedCount === 0) return;

    setIsDeleting(true);
    const selectedUserIds = new Set(bulkSelection.selectedIds);
    const selectedCount = bulkSelection.selectedCount;
    
    // 1. Immediately update UI - remove selected users optimistically
    setUsers(prevUsers => prevUsers.filter(user => !selectedUserIds.has(user.id)));
    bulkSelection.clearSelection();
    setShowBulkDeleteConfirm(false);
    
    // 2. Make API calls in parallel
    const deletePromises = Array.from(selectedUserIds).map(userId => 
      UserService.deleteUser(userId, session?.access_token)
    );
    
    try {
      const results = await Promise.allSettled(deletePromises);
      
      // 3. Handle any failures - add back users that failed to delete
      const failedResults = results
        .map((result, index) => ({ result, userId: Array.from(selectedUserIds)[index] }))
        .filter(({ result }) => result.status === 'rejected');
      
      if (failedResults.length > 0) {
        // Re-fetch to restore accurate state and show error
        fetchUsers();
        toast.error(`Failed to delete ${failedResults.length} of ${selectedCount} users`);
      } else {
        toast.success(`${selectedCount} users deleted successfully`);
      }
    } catch (error) {
      // Complete failure - refresh to restore UI state
      fetchUsers();
      toast.error("Failed to delete users");
    } finally {
      setIsDeleting(false);
    }
  }, [bulkSelection, setUsers, fetchUsers, session?.access_token]);

  // Individual delete with optimistic UI
  const handleIndividualDelete = useCallback(async (user: UserProfile) => {
    setIsDeleting(true);
    
    // 1. Immediately remove from UI
    setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
    setShowIndividualDeleteConfirm(false);
    setUserToDelete(null);
    
    try {
      // 2. Make API call
      await UserService.deleteUser(user.id, session?.access_token);
      toast.success(`${user.first_name} ${user.last_name} deleted successfully`);
    } catch (error) {
      // 3. Restore user on failure
      fetchUsers();
      toast.error(`Failed to delete ${user.first_name} ${user.last_name}`);
    } finally {
      setIsDeleting(false);
    }
  }, [setUsers, fetchUsers, session?.access_token]);

  // Selection action bar component
  const SelectionActionBar = () => {
    const selectedCount = bulkSelection.selectedCount;
    if (selectedCount === 0) return null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm sticky top-0 z-10 transition-all duration-200 ease-in-out animate-in fade-in slide-in-from-top-2 mb-4">
        <div className="px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={bulkSelection.isAllSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = bulkSelection.isSomeSelected;
                }
              }}
              onChange={bulkSelection.toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-foreground">
              {selectedCount} {selectedCount === 1 ? "User" : "Users"} Selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={bulkSelection.clearSelection}
              className="text-gray-500 hover:text-gray-700 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="bg-white shadow-sm rounded-xl p-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <div>
              <div className="text-2xl font-semibold">Manage Users</div>
              <div className="text-muted-foreground text-sm mb-4">
                User Management
              </div>
              {/* User Statistics */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{activeUsersCount}</span> Active
                  </span>
                </div>
                {pendingInvitesCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{pendingInvitesCount}</span> Pending
                    </span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{totalUsers}</span> Total
                </div>
              </div>
            </div>
            <Button
              onClick={() => setInviteDialogOpen(true)}
              className="self-start sm:self-auto"
            >
              Invite User
            </Button>
          </div>

          {/* Search Input */}
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="mb-4"
          />

          {/* Selection Action Bar */}
          <SelectionActionBar />

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={bulkSelection.isAllSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = bulkSelection.isSomeSelected;
                          }
                        }}
                        onChange={bulkSelection.toggleAll}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="px-5 py-4">Name</TableHead>
                  <TableHead className="px-5 py-4">Email</TableHead>
                  <TableHead className="px-5 py-4 text-center">Role</TableHead>
                  <TableHead className="px-5 py-4 text-right">
                    Last Login
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-sm text-gray-500"
                    >
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-sm text-gray-500"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <TableRow
                      key={user.id}
                      className={`group cursor-pointer transition hover:bg-muted ${
                        bulkSelection.isSelected(user.id) ? "bg-blue-50" : ""
                      } ${idx % 2 === 1 ? "bg-muted/50" : ""}`}
                    >
                      <TableCell>
                        <div className="flex justify-center">
                          {!isCurrentUser(user) ? (
                            <input
                              type="checkbox"
                              checked={bulkSelection.isSelected(user.id)}
                              onChange={() => bulkSelection.toggleSelection(user.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
                            />
                          ) : (
                            <div className="w-4 h-4" /> // Placeholder to maintain alignment
                          )}
                        </div>
                      </TableCell>
                      <TableCell 
                        className="px-5 py-4"
                        onClick={() => handleRowClick(user)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{user.first_name} {user.last_name}</span>
                          {isCurrentUser(user) && (
                            <Badge variant="secondary" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell 
                        className="px-5 py-4"
                        onClick={() => handleRowClick(user)}
                      >
                        {user.email}
                      </TableCell>
                      <TableCell 
                        className="px-5 py-4 text-center"
                        onClick={() => handleRowClick(user)}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>
                            {Array.isArray(user.role)
                              ? user.role.join(", ")
                              : user.role}
                          </span>
                          {isPendingInvite(user) && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell 
                        className="px-5 py-4 text-right"
                        onClick={() => handleRowClick(user)}
                      >
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
                      <TableCell className="w-12">
                        {!isCurrentUser(user) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(user);
                              setShowIndividualDeleteConfirm(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{bulkSelection.selectedCount}</strong>{" "}
              {bulkSelection.selectedCount === 1 ? "user" : "users"}? 
              This action cannot be undone and will permanently remove their
              accounts and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Users"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Individual Delete Confirmation Dialog */}
      <AlertDialog open={showIndividualDeleteConfirm} onOpenChange={setShowIndividualDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {userToDelete?.first_name} {userToDelete?.last_name}
              </strong>
              ? This action cannot be undone and will permanently remove their
              account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleIndividualDelete(userToDelete)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default memo(UserManagementSection);
export { UserManagementSection };
