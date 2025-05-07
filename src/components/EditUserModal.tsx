import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/authFetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const editUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["user", "admin"], {
    required_error: "Please select a role",
  }),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface UserToEdit {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserToEdit | null;
  onSuccess?: () => void;
}

export function EditUserModal({ open, onOpenChange, user, onSuccess }: EditUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      role: (user?.role as "user" | "admin") || "user",
    },
  });

  // Update form values when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role as "user" | "admin",
      });
    }
  }, [user, form]);

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await authFetch(
        `${apiBaseUrl}/users/${user.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        },
        session?.access_token
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update user");
      }

      toast({
        title: "Success",
        description: "User has been updated successfully.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            {/* Read-only email field */}
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input value={user?.email || ""} disabled />
            </FormItem>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 