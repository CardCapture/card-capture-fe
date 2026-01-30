import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { logger } from '@/utils/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserService } from "@/services/UserService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/toast";
import { Trash2, X, Check, Crown, Camera, Eye, Mail } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const editUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roles: z
    .array(z.enum(["admin", "recruiter", "reviewer"]))
    .min(1, "At least one role is required"),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface UserToEdit {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ("admin" | "recruiter" | "reviewer")[];
}

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserToEdit | null;
  onSuccess?: () => void;
}

const roleOptions = [
  {
    value: "admin",
    label: "Admin",
    description: "Full system access",
    icon: Crown,
  },
  {
    value: "recruiter",
    label: "Recruiter",
    description: "Scan & manage events",
    icon: Camera,
  },
  {
    value: "reviewer",
    label: "Reviewer",
    description: "Review card data",
    icon: Eye,
  },
];

export function EditUserModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { session } = useAuth();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      roles: user?.role || [],
    },
  });

  // Update form values when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.first_name,
        lastName: user.last_name,
        roles: user.role || [],
      });
    }
  }, [user, form]);

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await UserService.updateUser(
        user.id,
        {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.roles, // Send as array as expected by backend
        },
        session?.access_token
      );

      toast.updated("User");

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      logger.error("Error updating user:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update user. Please try again.",
        "Error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id) return;

    setIsDeleting(true);
    try {
      await UserService.deleteUser(user.id, session?.access_token);

      toast.success("User deleted successfully");

      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      logger.error("Error deleting user:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete user. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    setIsSendingReset(true);
    try {
      await UserService.resetPassword(user.email, session?.access_token);

      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      logger.error("Error sending password reset email:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send password reset email. Please try again."
      );
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-[500px]">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                Edit User
              </DialogPrimitive.Title>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => {
                  // Trim whitespace from all fields
                  const trimmedData = {
                    ...data,
                    firstName: data.firstName.trim(),
                    lastName: data.lastName.trim(),
                    roles: data.roles,
                  };
                  onSubmit(trimmedData);
                })}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Email is not editable, but show it */}
                {user?.email && (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input value={user.email} disabled />
                    </FormControl>
                    <div className="flex justify-end mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetPassword}
                        disabled={isSendingReset || isSubmitting || isDeleting}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Mail className="h-3 w-3" />
                        {isSendingReset ? "Sending..." : "Send Reset Email"}
                      </Button>
                    </div>
                  </FormItem>
                )}
                <FormField
                  control={form.control}
                  name="roles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roles</FormLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {roleOptions.map((role) => {
                          const roleValue = role.value as
                            | "admin"
                            | "recruiter"
                            | "reviewer";
                          const isSelected =
                            field.value?.includes(roleValue) || false;
                          const IconComponent = role.icon;
                          return (
                            <div
                              key={role.value}
                              onClick={() => {
                                const currentRoles = field.value || [];
                                if (role.value === "admin") {
                                  if (currentRoles.includes("admin")) {
                                    field.onChange(
                                      currentRoles.filter((r) => r !== "admin")
                                    );
                                  } else {
                                    field.onChange(["admin"]);
                                  }
                                } else {
                                  if (currentRoles.includes("admin")) {
                                    field.onChange([roleValue]);
                                  } else {
                                    if (currentRoles.includes(roleValue)) {
                                      field.onChange(
                                        currentRoles.filter(
                                          (r) => r !== roleValue
                                        )
                                      );
                                    } else {
                                      field.onChange([
                                        ...currentRoles,
                                        roleValue,
                                      ]);
                                    }
                                  }
                                }
                              }}
                              className={cn(
                                "relative cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:border-blue-300",
                                isSelected
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                              <div className="flex flex-col items-center space-y-2">
                                <IconComponent
                                  className={cn(
                                    "h-5 w-5",
                                    isSelected
                                      ? "text-blue-600"
                                      : "text-gray-500"
                                  )}
                                />
                                <div>
                                  <div className="text-sm font-medium">
                                    {role.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {role.description}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between items-center pt-6">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting || isDeleting}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete User
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isDeleting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {user?.first_name} {user?.last_name}
              </strong>
              ? This action cannot be undone and will permanently remove their
              account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
}
