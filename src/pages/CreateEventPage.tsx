import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle,
  Calendar,
  MapPin,
  User,
  FileText,
  UserPlus,
  Mail,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { toast } from "@/lib/toast";
import {
  submitEvent,
  EventSubmissionData,
} from "@/services/EventSubmissionService";
import { validators } from "@/utils/validation";
import { loadHCaptchaScript, getCaptchaToken } from "@/utils/captcha";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

interface FormData {
  name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  needs_inquiry_cards: boolean;
  expected_students: string;
  // Secondary contact
  has_secondary_contact: boolean;
  contact_name_secondary: string;
  contact_email_secondary: string;
  contact_phone_secondary: string;
  // Inquiry cards mailing address
  inquiry_cards_same_as_event_address: boolean;
  inquiry_cards_address: string;
  inquiry_cards_city: string;
  inquiry_cards_state: string;
  inquiry_cards_zip: string;
  inquiry_cards_attention: string;
}

const initialFormData: FormData = {
  name: "",
  event_date: "",
  start_time: "",
  end_time: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  location: "",
  address: "",
  city: "",
  state: "TX",
  zip: "",
  description: "",
  needs_inquiry_cards: false,
  expected_students: "",
  // Secondary contact
  has_secondary_contact: false,
  contact_name_secondary: "",
  contact_email_secondary: "",
  contact_phone_secondary: "",
  // Inquiry cards mailing address
  inquiry_cards_same_as_event_address: true,
  inquiry_cards_address: "",
  inquiry_cards_city: "",
  inquiry_cards_state: "TX",
  inquiry_cards_zip: "",
  inquiry_cards_attention: "",
};

// Format phone number as user types: (555) 123-4567
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");

  // Format based on length
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

// Format number with commas: 5000 -> 5,000
const formatNumberWithCommas = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  // Add commas for thousands
  return parseInt(digits, 10).toLocaleString("en-US");
};

const CreateEventPage: React.FC = () => {
  // Load hCaptcha script
  useEffect(() => {
    return loadHCaptchaScript();
  }, []);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Event name is required";
    }
    if (!formData.event_date) {
      newErrors.event_date = "Event date is required";
    }
    if (!formData.contact_name.trim()) {
      newErrors.contact_name = "Contact name is required";
    }
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = "Contact email is required";
    } else {
      const emailError = validators.email(formData.contact_email);
      if (emailError) {
        newErrors.contact_email = emailError;
      }
    }
    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = "Contact phone is required";
    } else {
      const phoneError = validators.phone(formData.contact_phone);
      if (phoneError) {
        newErrors.contact_phone = phoneError;
      }
    }

    // Optional field validation
    if (formData.zip) {
      const zipError = validators.zipCode(formData.zip);
      if (zipError) {
        newErrors.zip = zipError;
      }
    }

    // Validate expected students if inquiry cards are requested
    if (formData.needs_inquiry_cards && !formData.expected_students.trim()) {
      newErrors.expected_students = "Please enter expected number of students";
    } else if (formData.expected_students) {
      const num = parseInt(formData.expected_students.replace(/,/g, ""), 10);
      if (isNaN(num) || num < 1) {
        newErrors.expected_students = "Please enter a valid number";
      } else if (num > 50000) {
        newErrors.expected_students = "Number seems too high";
      }
    }

    // Validate secondary contact if enabled
    if (formData.has_secondary_contact) {
      if (formData.contact_email_secondary.trim()) {
        const emailError = validators.email(formData.contact_email_secondary);
        if (emailError) {
          newErrors.contact_email_secondary = emailError;
        }
      }
      if (formData.contact_phone_secondary.trim()) {
        const phoneError = validators.phone(formData.contact_phone_secondary);
        if (phoneError) {
          newErrors.contact_phone_secondary = phoneError;
        }
      }
    }

    // Validate mailing address if inquiry cards requested and not same as event address
    if (formData.needs_inquiry_cards && !formData.inquiry_cards_same_as_event_address) {
      if (!formData.inquiry_cards_address.trim()) {
        newErrors.inquiry_cards_address = "Mailing address is required";
      }
      if (!formData.inquiry_cards_city.trim()) {
        newErrors.inquiry_cards_city = "City is required";
      }
      if (!formData.inquiry_cards_state.trim()) {
        newErrors.inquiry_cards_state = "State is required";
      }
      if (!formData.inquiry_cards_zip.trim()) {
        newErrors.inquiry_cards_zip = "ZIP code is required";
      } else {
        const zipError = validators.zipCode(formData.inquiry_cards_zip);
        if (zipError) {
          newErrors.inquiry_cards_zip = zipError;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setLoading(true);

    try {
      const captchaToken = await getCaptchaToken('event_submission');

      const submissionData: EventSubmissionData = {
        name: formData.name,
        event_date: formData.event_date,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        ...(formData.start_time && { start_time: formData.start_time }),
        ...(formData.end_time && { end_time: formData.end_time }),
        ...(formData.location && { location: formData.location }),
        ...(formData.address && { address: formData.address }),
        ...(formData.city && { city: formData.city }),
        ...(formData.state && { state: formData.state }),
        ...(formData.zip && { zip: formData.zip }),
        ...(formData.description && { description: formData.description }),
        captcha_token: captchaToken,
        needs_inquiry_cards: formData.needs_inquiry_cards,
        ...(formData.expected_students && { expected_students: parseInt(formData.expected_students.replace(/,/g, ""), 10) }),
        // Secondary contact
        ...(formData.has_secondary_contact && formData.contact_name_secondary && { contact_name_secondary: formData.contact_name_secondary }),
        ...(formData.has_secondary_contact && formData.contact_email_secondary && { contact_email_secondary: formData.contact_email_secondary }),
        ...(formData.has_secondary_contact && formData.contact_phone_secondary && { contact_phone_secondary: formData.contact_phone_secondary }),
        // Inquiry cards mailing address
        ...(formData.needs_inquiry_cards && { inquiry_cards_same_as_event_address: formData.inquiry_cards_same_as_event_address }),
        ...(formData.needs_inquiry_cards && !formData.inquiry_cards_same_as_event_address && formData.inquiry_cards_address && { inquiry_cards_address: formData.inquiry_cards_address }),
        ...(formData.needs_inquiry_cards && !formData.inquiry_cards_same_as_event_address && formData.inquiry_cards_city && { inquiry_cards_city: formData.inquiry_cards_city }),
        ...(formData.needs_inquiry_cards && !formData.inquiry_cards_same_as_event_address && formData.inquiry_cards_state && { inquiry_cards_state: formData.inquiry_cards_state }),
        ...(formData.needs_inquiry_cards && !formData.inquiry_cards_same_as_event_address && formData.inquiry_cards_zip && { inquiry_cards_zip: formData.inquiry_cards_zip }),
        ...(formData.needs_inquiry_cards && !formData.inquiry_cards_same_as_event_address && formData.inquiry_cards_attention && { inquiry_cards_attention: formData.inquiry_cards_attention }),
      };

      await submitEvent(submissionData);

      setSubmitted(true);
      toast.success("Event submitted successfully!");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="container mx-auto max-w-lg">
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Event Submitted!
              </h2>
              <p className="text-gray-600 mb-6">
                Your event has been successfully added to the CardCapture
                catalog. A confirmation email has been sent to{" "}
                {formData.contact_email}.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-500 mb-1">Event Name</p>
                <p className="font-semibold text-gray-900">{formData.name}</p>
                <p className="text-sm text-gray-500 mt-3 mb-1">Event Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(formData.event_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData(initialFormData);
                  }}
                >
                  Submit Another Event
                </Button>
                <Link to="/">
                  <Button>Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Submit Your Event
          </h1>
          <p className="text-gray-600">
            Add your college fair or recruiting event to the CardCapture catalog
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Event Details
              </CardTitle>
              <CardDescription>
                Enter the basic information about your event
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Event Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Austin College Fair 2025"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="event_date">
                  Event Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => updateField("event_date", e.target.value)}
                  className={errors.event_date ? "border-red-500" : ""}
                />
                {errors.event_date && (
                  <p className="text-sm text-red-500">{errors.event_date}</p>
                )}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => updateField("start_time", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => updateField("end_time", e.target.value)}
                  />
                </div>
              </div>

              {/* Location Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Location
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Venue Name</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Austin Convention Center"
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                    />
                  </div>

                  <AddressAutocomplete
                    label="Street Address"
                    value={formData.address}
                    onChange={(value) => updateField("address", value)}
                    onAddressSelect={(address) => {
                      updateField("address", address.street);
                      updateField("city", address.city);
                      updateField("state", address.state);
                      updateField("zip", address.zipCode);
                    }}
                    helpText="Start typing and select from suggestions"
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => updateField("city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => updateField("state", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={formData.zip}
                        onChange={(e) => updateField("zip", e.target.value)}
                        className={errors.zip ? "border-red-500" : ""}
                      />
                      {errors.zip && (
                        <p className="text-sm text-red-500">{errors.zip}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">
                      Contact Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact_name"
                      placeholder="Your name"
                      value={formData.contact_name}
                      onChange={(e) =>
                        updateField("contact_name", e.target.value)
                      }
                      className={errors.contact_name ? "border-red-500" : ""}
                    />
                    {errors.contact_name && (
                      <p className="text-sm text-red-500">
                        {errors.contact_name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contact_email"
                        type="email"
                        placeholder="email@example.com"
                        value={formData.contact_email}
                        onChange={(e) =>
                          updateField("contact_email", e.target.value)
                        }
                        className={errors.contact_email ? "border-red-500" : ""}
                      />
                      {errors.contact_email && (
                        <p className="text-sm text-red-500">
                          {errors.contact_email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.contact_phone}
                        onChange={(e) =>
                          updateField("contact_phone", formatPhoneNumber(e.target.value))
                        }
                        className={errors.contact_phone ? "border-red-500" : ""}
                      />
                      {errors.contact_phone && (
                        <p className="text-sm text-red-500">
                          {errors.contact_phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Secondary Contact Toggle */}
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Add a second contact</span>
                    </div>
                    <Switch
                      checked={formData.has_secondary_contact}
                      onCheckedChange={(checked) => {
                        updateField("has_secondary_contact", checked);
                        if (!checked) {
                          updateField("contact_name_secondary", "");
                          updateField("contact_email_secondary", "");
                          updateField("contact_phone_secondary", "");
                        }
                      }}
                    />
                  </div>

                  {/* Secondary Contact Fields */}
                  {formData.has_secondary_contact && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700">Secondary Contact</h4>
                      <div className="space-y-2">
                        <Label htmlFor="contact_name_secondary">Name</Label>
                        <Input
                          id="contact_name_secondary"
                          placeholder="Secondary contact name"
                          value={formData.contact_name_secondary}
                          onChange={(e) =>
                            updateField("contact_name_secondary", e.target.value)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact_email_secondary">Email</Label>
                          <Input
                            id="contact_email_secondary"
                            type="email"
                            placeholder="email@example.com"
                            value={formData.contact_email_secondary}
                            onChange={(e) =>
                              updateField("contact_email_secondary", e.target.value)
                            }
                            className={errors.contact_email_secondary ? "border-red-500" : ""}
                          />
                          {errors.contact_email_secondary && (
                            <p className="text-sm text-red-500">
                              {errors.contact_email_secondary}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_phone_secondary">Phone</Label>
                          <Input
                            id="contact_phone_secondary"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={formData.contact_phone_secondary}
                            onChange={(e) =>
                              updateField("contact_phone_secondary", formatPhoneNumber(e.target.value))
                            }
                            className={errors.contact_phone_secondary ? "border-red-500" : ""}
                          />
                          {errors.contact_phone_secondary && (
                            <p className="text-sm text-red-500">
                              {errors.contact_phone_secondary}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional details about your event..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </div>
              </div>

              {/* Inquiry Cards Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Paper Inquiry Cards
                </h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 text-sm">
                    CardCapture supports both QR code registration and universal inquiry cards. If you'd like inquiry cards,
                    select yes and tell us how many students you expect.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Do you need paper inquiry cards?</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="needs_inquiry_cards"
                          checked={!formData.needs_inquiry_cards}
                          onChange={() => {
                            updateField("needs_inquiry_cards", false);
                            updateField("expected_students", "");
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">No, QR codes only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="needs_inquiry_cards"
                          checked={formData.needs_inquiry_cards}
                          onChange={() => updateField("needs_inquiry_cards", true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Yes, I need inquiry cards</span>
                      </label>
                    </div>
                  </div>

                  {formData.needs_inquiry_cards && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="expected_students">
                          How many students do you anticipate attending?{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="expected_students"
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g., 1,500"
                          value={formData.expected_students}
                          onChange={(e) => updateField("expected_students", formatNumberWithCommas(e.target.value))}
                          className={errors.expected_students ? "border-red-500" : ""}
                        />
                        {errors.expected_students && (
                          <p className="text-sm text-red-500">{errors.expected_students}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          This helps us prepare the right number of cards for your event.
                        </p>
                      </div>

                      {/* Mailing Address Section */}
                      <div className="space-y-4 mt-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <Label className="text-base font-semibold">Mailing Address for Inquiry Cards</Label>
                        </div>

                        {/* Same as Event Address Toggle */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="inquiry_cards_same_as_event_address"
                            checked={formData.inquiry_cards_same_as_event_address}
                            onChange={(e) => {
                              updateField("inquiry_cards_same_as_event_address", e.target.checked);
                              if (e.target.checked) {
                                // Clear mailing address fields when using event address
                                updateField("inquiry_cards_address", "");
                                updateField("inquiry_cards_city", "");
                                updateField("inquiry_cards_state", "TX");
                                updateField("inquiry_cards_zip", "");
                                updateField("inquiry_cards_attention", "");
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <Label htmlFor="inquiry_cards_same_as_event_address" className="text-sm cursor-pointer">
                            Same as event address
                          </Label>
                        </div>

                        {formData.inquiry_cards_same_as_event_address && formData.address && (
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            <p className="font-medium">Cards will be mailed to:</p>
                            <p>{formData.address}</p>
                            <p>{formData.city}{formData.city && formData.state ? ", " : ""}{formData.state} {formData.zip}</p>
                          </div>
                        )}

                        {formData.inquiry_cards_same_as_event_address && !formData.address && (
                          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                            Please fill out the event address above, or uncheck this box to enter a different mailing address.
                          </p>
                        )}

                        {/* Custom Mailing Address Fields */}
                        {!formData.inquiry_cards_same_as_event_address && (
                          <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="inquiry_cards_attention">Attention / Recipient Name</Label>
                              <Input
                                id="inquiry_cards_attention"
                                placeholder="e.g., Counseling Office"
                                value={formData.inquiry_cards_attention}
                                onChange={(e) => updateField("inquiry_cards_attention", e.target.value)}
                              />
                            </div>

                            <AddressAutocomplete
                              label="Street Address *"
                              value={formData.inquiry_cards_address}
                              onChange={(value) => updateField("inquiry_cards_address", value)}
                              onAddressSelect={(address) => {
                                updateField("inquiry_cards_address", address.street);
                                updateField("inquiry_cards_city", address.city);
                                updateField("inquiry_cards_state", address.state);
                                updateField("inquiry_cards_zip", address.zipCode);
                              }}
                              error={errors.inquiry_cards_address}
                              helpText="Start typing and select from suggestions"
                              required
                            />

                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="inquiry_cards_city">
                                  City <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="inquiry_cards_city"
                                  value={formData.inquiry_cards_city}
                                  onChange={(e) => updateField("inquiry_cards_city", e.target.value)}
                                  className={errors.inquiry_cards_city ? "border-red-500" : ""}
                                />
                                {errors.inquiry_cards_city && (
                                  <p className="text-sm text-red-500">{errors.inquiry_cards_city}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label>
                                  State <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={formData.inquiry_cards_state}
                                  onValueChange={(value) => updateField("inquiry_cards_state", value)}
                                >
                                  <SelectTrigger className={errors.inquiry_cards_state ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {US_STATES.map((state) => (
                                      <SelectItem key={state} value={state}>
                                        {state}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {errors.inquiry_cards_state && (
                                  <p className="text-sm text-red-500">{errors.inquiry_cards_state}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="inquiry_cards_zip">
                                  ZIP Code <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="inquiry_cards_zip"
                                  value={formData.inquiry_cards_zip}
                                  onChange={(e) => updateField("inquiry_cards_zip", e.target.value)}
                                  className={errors.inquiry_cards_zip ? "border-red-500" : ""}
                                />
                                {errors.inquiry_cards_zip && (
                                  <p className="text-sm text-red-500">{errors.inquiry_cards_zip}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Event"
                )}
              </Button>
              <p className="text-sm text-gray-500 text-center">
                By submitting, you agree to our{" "}
                <Link to="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateEventPage;
