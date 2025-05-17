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
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { formatPhoneNumber } from "@/lib/utils";

interface ManualEntryForm {
  name: string;
  preferred_first_name: string;
  date_of_birth: string;
  email: string;
  cell: string;
  permission_to_text: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  high_school: string;
  class_rank: string;
  students_in_class: string;
  gpa: string;
  student_type: string;
  entry_term: string;
  major: string;
}

interface ManualEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ManualEntryForm;
  onChange: (field: keyof ManualEntryForm, value: string) => void;
  onSubmit: () => void;
}

// Helper to format MMDDYYYY as MM/DD/YYYY as user types
function formatBirthdayInput(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0,2)}/${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0,2)}/${cleaned.slice(2,4)}/${cleaned.slice(4,8)}`;
  return `${cleaned.slice(0,2)}/${cleaned.slice(2,4)}/${cleaned.slice(4,8)}`;
}

// Helper to format 10-digit phone as 512-694-6172 as user types
function formatPhoneInput(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0,3)}-${cleaned.slice(3)}`;
  if (cleaned.length <= 10) return `${cleaned.slice(0,3)}-${cleaned.slice(3,6)}-${cleaned.slice(6,10)}`;
  return `${cleaned.slice(0,3)}-${cleaned.slice(3,6)}-${cleaned.slice(6,10)}`;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  open,
  onOpenChange,
  form,
  onChange,
  onSubmit,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-2xl p-0">
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>Record Contact Information</DialogTitle>
        <DialogDescription>
          Manually enter a contact's information to add to this event.
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Full Name"
          />
        </div>
        <div>
          <Label htmlFor="preferred_first_name">Preferred First Name</Label>
          <Input
            id="preferred_first_name"
            value={form.preferred_first_name}
            onChange={(e) => onChange("preferred_first_name", e.target.value)}
            placeholder="Preferred Name"
          />
        </div>
        <div>
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            value={form.date_of_birth}
            onChange={(e) => onChange("date_of_birth", formatBirthdayInput(e.target.value))}
            placeholder="MM/DD/YYYY"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="Email"
          />
        </div>
        <div>
          <Label htmlFor="cell">Phone</Label>
          <Input
            id="cell"
            value={form.cell}
            onChange={(e) => onChange("cell", formatPhoneInput(e.target.value))}
            placeholder="(123) 456-7890"
          />
        </div>
        <div>
          <Label htmlFor="permission_to_text">Permission to Text</Label>
          <Select value={form.permission_to_text} onValueChange={val => onChange("permission_to_text", val)}>
            <SelectTrigger id="permission_to_text">{form.permission_to_text ? (form.permission_to_text === "yes" ? "Yes" : "No") : "Select..."}</SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="border rounded-md p-4 bg-gray-50 space-y-4">
          <div className="font-semibold text-gray-700 mb-2">Address</div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => onChange("address", e.target.value)}
              placeholder="123 Main St"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => onChange("city", e.target.value)}
              placeholder="City"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={form.state}
              onChange={(e) => onChange("state", e.target.value)}
              placeholder="State"
            />
          </div>
          <div>
            <Label htmlFor="zip_code">Zip Code</Label>
            <Input
              id="zip_code"
              value={form.zip_code}
              onChange={(e) => onChange("zip_code", e.target.value)}
              placeholder="Zip Code"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="high_school">High School / College</Label>
          <Input
            id="high_school"
            value={form.high_school}
            onChange={(e) => onChange("high_school", e.target.value)}
            placeholder="High School / College"
          />
        </div>
        <div>
          <Label htmlFor="class_rank">Class Rank</Label>
          <Input
            id="class_rank"
            value={form.class_rank}
            onChange={(e) => onChange("class_rank", e.target.value)}
            placeholder="Class Rank"
          />
        </div>
        <div>
          <Label htmlFor="students_in_class">Students in Class</Label>
          <Input
            id="students_in_class"
            value={form.students_in_class}
            onChange={(e) => onChange("students_in_class", e.target.value)}
            placeholder="Total Students"
          />
        </div>
        <div>
          <Label htmlFor="gpa">GPA</Label>
          <Input
            id="gpa"
            value={form.gpa}
            onChange={(e) => onChange("gpa", e.target.value)}
            placeholder="GPA"
          />
        </div>
        <div>
          <Label htmlFor="student_type">Student Type</Label>
          <Input
            id="student_type"
            value={form.student_type}
            onChange={(e) => onChange("student_type", e.target.value)}
            placeholder="Student Type"
          />
        </div>
        <div>
          <Label htmlFor="entry_term">Entry Term</Label>
          <Input
            id="entry_term"
            value={form.entry_term}
            onChange={(e) => onChange("entry_term", e.target.value)}
            placeholder="Fall 2025"
          />
        </div>
        <div>
          <Label htmlFor="major">Major</Label>
          <Input
            id="major"
            value={form.major}
            onChange={(e) => onChange("major", e.target.value)}
            placeholder="Intended Major"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4 border-t bg-white">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" onClick={onSubmit}>
          Save
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default ManualEntryModal;
