import React, { useMemo, useState } from "react";
import { StudentService, type StudentRegisterPayload } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartDateInput } from "@/components/ui/smart-date-input";
import { SmartPhoneInput } from "@/components/ui/smart-phone-input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { useToast } from "@/hooks/use-toast";

export default function StudentSignupPage() {
  const [form, setForm] = useState<StudentRegisterPayload>({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    email_opt_in: true,
    sms_opt_in: false,
  });
  const [qrDataUri, setQrDataUri] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const states = useMemo(
    () => [
      "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
    ],
    []
  );

  const gradeLevels = ["9", "10", "11", "12", "College Transfer"];
  const terms = ["Fall", "Spring", "Summer", "Winter", "Unknown"]; 
  const currentYear = new Date().getFullYear();
  const startYears = Array.from({ length: 7 }).map((_, i) => String(currentYear + i));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Prepare payload
      const payload: StudentRegisterPayload = {
        ...form,
        gpa: form.gpa ? Number(form.gpa as unknown as string) : undefined,
        gpa_scale: form.gpa_scale ? Number(form.gpa_scale as unknown as string) : undefined,
        sat_score: form.sat_score ? Number(form.sat_score as unknown as string) : undefined,
        act_score: form.act_score ? Number(form.act_score as unknown as string) : undefined,
        start_year: form.start_year ? Number(form.start_year as unknown as string) : undefined,
        academic_interests: (form as any).academic_interests_text
          ? (form as any).academic_interests_text.split(",").map((s: string) => s.trim()).filter((s: string) => !!s)
          : undefined,
      } as any;

      const res = await StudentService.registerStudent(payload);
      setQrDataUri(res.qrDataUri);
      setToken(res.token);
      setSubmitted(true);
      toast({ title: "Registered", description: "Your QR code is ready." });
    } catch (err: any) {
      setError(err?.message || "Failed to register");
      toast({ title: "Registration failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold mb-2">You're all set!</h1>
        <p className="text-slate-600 mb-4">
          Show this QR code at any college booth using CardCapture to share your
          info. We've also emailed it to you.
        </p>
        {qrDataUri && (
          <img src={qrDataUri} alt="Your QR" className="w-56 h-56 mb-4" />
        )}
        {token && (
          <div className="bg-slate-50 border rounded p-3 mb-4">
            <div className="text-sm text-slate-600 mb-1">Your code</div>
            <div className="flex items-center gap-2">
              <code className="text-sm break-all">{token}</code>
              <button
                className="ml-auto bg-slate-200 hover:bg-slate-300 text-slate-900 rounded px-2 py-1 text-xs"
                onClick={() => navigator.clipboard.writeText(token)}
              >
                Copy
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-1">Paste this in the event page scanner if needed.</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-semibold mb-2">Student Registration</h1>
      <p className="text-slate-600 mb-6">Tell us a bit about you. You’ll get a QR code to share with colleges.</p>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <Card>
        <CardContent className="p-6">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            {/* Contact */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <SmartPhoneInput 
                label="Mobile" 
                value={form.mobile} 
                onChange={(value) => setForm((f) => ({ ...f, mobile: value }))} 
                helpText="Format: XXX-XXX-XXXX"
              />
            </div>

            <div>
              <SmartDateInput 
                label="Date of birth (optional)" 
                value={(form as any).dob || ""} 
                onChange={(value) => setForm((f) => ({ ...f, dob: value } as any))} 
                helpText="Format: MM/DD/YYYY"
              />
            </div>

            {/* Address */}
            <div className="col-span-1 md:col-span-2">
              <AddressAutocomplete 
                label="Address" 
                value={(form as any).address1 || ""} 
                onChange={(value) => setForm((f) => ({ ...f, address1: value } as any))}
                onAddressSelect={(address) => {
                  setForm((f) => ({ 
                    ...f, 
                    address1: address.street,
                    address2: address.street2,
                    city: address.city,
                    state: address.state,
                    zip: address.zipCode
                  } as any));
                }}
                helpText="Start typing your address for suggestions"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label htmlFor="address2">Address 2</Label>
              <Input id="address2" name="address2" value={(form as any).address2 || ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={(form as any).city || ""} onChange={handleChange} />
            </div>
            <div>
              <Label>State</Label>
              <Select value={(form as any).state || ""} onValueChange={(v) => setForm((f) => ({ ...f, state: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" name="zip" value={(form as any).zip || ""} onChange={handleChange} />
            </div>

            {/* Academic */}
            <div className="col-span-1 md:col-span-2">
              <Label htmlFor="high_school">Current School</Label>
              <Input id="high_school" name="high_school" value={(form as any).high_school || ""} onChange={handleChange} />
            </div>
            <div>
              <Label>Grade</Label>
              <Select value={(form as any).grade_level || ""} onValueChange={(v) => setForm((f) => ({ ...f, grade_level: v, student_type: v === 'College Transfer' ? 'Transfer' : 'Freshman' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grad_year">{(form as any).grade_level === 'College Transfer' ? 'HS Graduation Year' : 'Graduation Year'}</Label>
              <Input id="grad_year" name="grad_year" value={(form as any).grad_year || ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="gpa">GPA</Label>
              <Input id="gpa" name="gpa" type="number" step="0.01" value={(form as any).gpa as any || ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="gpa_scale">GPA Scale</Label>
              <Input id="gpa_scale" name="gpa_scale" type="number" step="0.01" value={(form as any).gpa_scale as any || ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="sat_score">SAT</Label>
              <Input id="sat_score" name="sat_score" type="number" value={(form as any).sat_score as any || ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="act_score">ACT</Label>
              <Input id="act_score" name="act_score" type="number" value={(form as any).act_score as any || ""} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="academic_interests_text">Academic Interests (comma separated)</Label>
              <Input id="academic_interests_text" name="academic_interests_text" placeholder="e.g., Computer Science, Biology" value={(form as any).academic_interests_text || ""} onChange={handleChange} />
            </div>
            <div>
              <Label>Intended Start Term</Label>
              <Select value={(form as any).start_term || ""} onValueChange={(v) => setForm((f) => ({ ...f, start_term: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Intended Start Year</Label>
              <Select value={String((form as any).start_year || "")} onValueChange={(v) => setForm((f) => ({ ...f, start_year: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {startYears.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opt-ins */}
            <div className="md:col-span-2 flex items-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <input id="email_opt_in" type="checkbox" name="email_opt_in" checked={!!form.email_opt_in} onChange={handleChange} />
                <Label htmlFor="email_opt_in" className="cursor-pointer">Colleges may email me</Label>
              </div>
              <div className="flex items-center gap-2">
                <input id="sms_opt_in" type="checkbox" name="sms_opt_in" checked={!!form.sms_opt_in} onChange={handleChange} />
                <Label htmlFor="sms_opt_in" className="cursor-pointer">Colleges may text me</Label>
              </div>
            </div>

            <div className="md:col-span-2 mt-2">
              <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                {submitting ? "Submitting..." : "Get my QR code"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


