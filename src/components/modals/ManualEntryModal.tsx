import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ManualEntryForm {
  name: string;
  email: string;
  cell: string;
  date_of_birth: string;
}

interface ManualEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ManualEntryForm;
  onChange: (field: keyof ManualEntryForm, value: string) => void;
  onSubmit: () => void;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  open,
  onOpenChange,
  form,
  onChange,
  onSubmit,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Record Contact Information</DialogTitle>
        <DialogDescription>
          Manually enter a contact's information to add to this event.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="johndoe@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cell">Phone</Label>
          <Input
            id="cell"
            value={form.cell}
            onChange={(e) => onChange("cell", e.target.value)}
            placeholder="(123) 456-7890"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Birthday</Label>
          <Input
            id="dob"
            value={form.date_of_birth}
            onChange={(e) => onChange("date_of_birth", e.target.value)}
            placeholder="MM/DD/YYYY"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" onClick={onSubmit}>
          Add Contact
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ManualEntryModal;
