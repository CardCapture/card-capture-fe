import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/lib/toast";
import { Check, Crown, Camera, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const inviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roles: z
    .array(z.enum(["admin", "recruiter", "reviewer"]))
    .min(1, "At least one role is required"),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function InviteUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  // Use shared profile hook instead of duplicate fetching
  const {
    schoolId,
    loading: profileLoading,
    error: profileError,
  } = useProfile();

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roles: ["reviewer"], // Default to reviewer role
    },
  });

  const onSubmit = async (data: InviteUserFormValues) => {
    if (!schoolId) {
      toast.error("School information not available. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await UserService.inviteUser(
        {
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.roles,
          school_id: schoolId,
        },
        session?.access_token
      );

      toast.success("User invited successfully");

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to invite user. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-[425px]">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
              Invite User
            </DialogPrimitive.Title>
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                // Trim whitespace from all fields
                const trimmedData = {
                  ...data,
                  email: data.email.trim(),
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                                  isSelected ? "text-blue-600" : "text-gray-500"
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
              <div className="flex justify-end gap-3 pt-6">
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
              </div>
            </form>
          </Form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
