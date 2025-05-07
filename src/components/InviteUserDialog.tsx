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
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const inviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["user", "admin"], {
    required_error: "Please select a role",
  }),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSchoolId = async () => {
      if (!session?.user?.id) {
        console.log('No session or user ID available');
        return;
      }
      
      console.log('Attempting to fetch profile for user:', session.user.id);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching school_id:', error);
          toast({
            title: "Error",
            description: "Could not fetch school information. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (!data) {
          console.warn('No profile found for user:', session.user.id);
          toast({
            title: "Profile Not Found",
            description: "Could not find your profile information. Please contact support.",
            variant: "destructive",
          });
          return;
        }

        console.log('Successfully found profile with school_id:', data.school_id);
        setSchoolId(data.school_id);
      } catch (e) {
        console.error('Unexpected error in fetchSchoolId:', e);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (open) {
      fetchSchoolId();
    }
  }, [session?.user?.id, open, toast]);

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "user",
    },
  });

  const onSubmit = async (data: InviteUserFormValues) => {
    if (!schoolId) {
      toast({
        title: "Error",
        description: "School information is not available. Please try again or contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const payload = {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        school_id: schoolId,
      };

      console.log('Sending invite with payload:', payload);

      const response = await authFetch(
        `${apiBaseUrl}/invite-user`,
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
        },
        session?.access_token
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to invite user");
      }

      toast({
        title: "Success",
        description: "User has been invited successfully.",
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error inviting user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to invite user. Please try again.",
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
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {isSubmitting ? "Inviting..." : "Invite User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 