import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RegistrationService } from '@/services/RegistrationService';

// CSS to prevent autofill styling glitches
const autofillStyles = `
  input:-webkit-autofill {
    -webkit-text-fill-color: inherit;
    transition: background-color 100000s ease-in-out 0s;
  }
`;

interface FormData {
  first_name: string;
  last_name: string;
  preferred_first_name?: string;
  email: string;
  cell?: string;
  email_opt_in: boolean;
  permission_to_text: boolean;
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  high_school?: string;
  grade_level?: string;
  grad_year?: string;
  gpa?: number;
  gpa_scale?: number;
  sat_score?: number;
  act_score?: number;
  student_type?: string;
  entry_term?: string;
  entry_year?: number;
  major?: string;
  academic_interests?: string[];
}

export default function RegistrationFormPage() {
  console.log('🔍🔍🔍 RegistrationFormPage: Component is loading!');
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    email_opt_in: true,
    permission_to_text: false,
  });

  // Add search states for typeahead
  const [schoolSuggestions, setSchoolSuggestions] = useState<any[]>([]);
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const [majorSuggestions, setMajorSuggestions] = useState<any[]>([]);
  const [showMajorSuggestions, setShowMajorSuggestions] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Search function for schools
  const searchSchools = async (query: string) => {
    if (query.length < 2) {
      setSchoolSuggestions([]);
      setShowSchoolSuggestions(false);
      return;
    }

    try {
      console.log('🔍 Searching schools for:', query);
      const response = await fetch(`http://localhost:8000/high-schools/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      console.log('🔍 School search results:', data);
      setSchoolSuggestions(data.results || []);
      setShowSchoolSuggestions(true);
    } catch (error) {
      console.error('🔍 School search error:', error);
      setSchoolSuggestions([]);
      setShowSchoolSuggestions(false);
    }
  };

  // Search function for majors
  const searchMajors = async (query: string) => {
    if (query.length < 2) {
      setMajorSuggestions([]);
      setShowMajorSuggestions(false);
      return;
    }

    try {
      console.log('🔍 Searching majors for:', query);
      const response = await fetch(`http://localhost:8000/majors/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      console.log('🔍 Major search results:', data);
      setMajorSuggestions(data.results || []);
      setShowMajorSuggestions(true);
    } catch (error) {
      console.error('🔍 Major search error:', error);
      setMajorSuggestions([]);
      setShowMajorSuggestions(false);
    }
  };

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

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionData = await RegistrationService.getFormSession();
      setSession(sessionData);
      
      // Pre-fill email if from magic link
      if (sessionData.email) {
        setForm(prev => ({ ...prev, email: sessionData.email }));
      }
    } catch (error) {
      toast({
        title: "Session expired",
        description: "Please start the registration process again.",
        variant: "destructive",
      });
      navigate('/register');
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare academic interests array from text
      const academicInterestsText = (form as any).academic_interests_text;
      const formData = {
        ...form,
        academic_interests: academicInterestsText
          ? academicInterestsText.split(',').map((s: string) => s.trim()).filter((s: string) => !!s)
          : undefined,
      };

      const result = await RegistrationService.submitRegistration(formData);
      
      // Navigate to success page
      navigate('/register/success', { 
        state: { 
          verified: result.verified,
          message: result.message,
          token: result.token,
          qrDataUri: result.qrDataUri
        } 
      });

      toast({
        title: "Registration successful!",
        description: result.message,
      });

    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isEmailLocked = session?.session_type === 'magic_link';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <style dangerouslySetInnerHTML={{ __html: autofillStyles }} />
      <div className="container mx-auto max-w-4xl px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold mb-2">Complete Your Registration</h1>
          <p className="text-gray-600">
            {session?.session_type === 'magic_link' 
              ? 'Verified via email - just fill out your details below' 
              : 'Enter your details to complete registration'}
          </p>
          {session?.session_type === 'magic_link' && (
            <div className="inline-flex items-center gap-1 mt-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Email verified</span>
            </div>
          )}
        </div>

        <div style={{backgroundColor: 'red', color: 'white', padding: '10px', fontSize: '20px', textAlign: 'center', margin: '10px'}}>
          🔍 REGISTRATION FORM IS LOADING
        </div>
        
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" autoComplete="off">
              {/* Contact Information */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input 
                    id="first_name" 
                    name="first_name" 
                    value={form.first_name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input 
                    id="last_name" 
                    name="last_name" 
                    value={form.last_name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preferred_first_name">Preferred First Name</Label>
                <Input 
                  id="preferred_first_name" 
                  name="preferred_first_name" 
                  value={form.preferred_first_name || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChange}
                  disabled={isEmailLocked}
                  className={isEmailLocked ? 'bg-gray-50' : ''}
                  required
                />
                {isEmailLocked && (
                  <p className="text-xs text-gray-500 mt-1">Email verified via magic link</p>
                )}
              </div>

              <div>
                <Label htmlFor="cell">Mobile Phone</Label>
                <Input 
                  id="cell" 
                  name="cell" 
                  value={form.cell || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input 
                  id="date_of_birth" 
                  name="date_of_birth" 
                  placeholder="YYYY-MM-DD" 
                  value={form.date_of_birth || ''} 
                  onChange={handleChange} 
                />
              </div>

              {/* Address */}
              <div className="col-span-1 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={form.address || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <Label htmlFor="address_2">Address 2</Label>
                <Input 
                  id="address_2" 
                  name="address_2" 
                  value={form.address_2 || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={form.city || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <Label>State</Label>
                <Select value={form.state || ''} onValueChange={(v) => handleSelectChange('state', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input 
                  id="zip_code" 
                  name="zip_code" 
                  value={form.zip_code || ''} 
                  onChange={handleChange} 
                />
              </div>

              {/* Academic Information */}
              <div className="col-span-1 md:col-span-2 relative">
                <Label htmlFor="schoolSearchQuery_zz">Current School</Label>
                {/* Decoy input to defeat aggressive autofill */}
                <input 
                  type="text" 
                  name="dummyDontAutofill" 
                  autoComplete="off" 
                  tabIndex={-1} 
                  aria-hidden="true" 
                  style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0}} 
                />
                <Input 
                  id="schoolSearchQuery_zz" 
                  name="schoolSearchQuery_zz" 
                  value={form.high_school || ''} 
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('🔍 High school input changed:', value);
                    setForm(prev => ({ ...prev, high_school: value }));
                    searchSchools(value);
                  }}
                  placeholder="Search for your high school..."
                  autoComplete="new-password"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="words"
                  inputMode="search"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="school-typeahead-listbox"
                  aria-expanded={showSchoolSuggestions}
                  data-lpignore="true"
                  data-form-type="other"
                />
                {showSchoolSuggestions && schoolSuggestions.length > 0 && (
                  <ul id="school-typeahead-listbox" role="listbox" className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {schoolSuggestions.map((school: any) => (
                      <li
                        key={school.id}
                        role="option"
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 cursor-pointer"
                        onClick={() => {
                          console.log('🔍 Selected school:', school);
                          setForm(prev => ({ ...prev, high_school: school.name }));
                          setShowSchoolSuggestions(false);
                        }}
                      >
                        <div className="font-medium text-gray-900">{school.name}</div>
                        {school.city && school.state && (
                          <div className="text-sm text-gray-500">{school.city}, {school.state}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <Label>Grade Level</Label>
                <Select value={form.grade_level || ''} onValueChange={(v) => handleSelectChange('grade_level', v)}>
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
                <Label htmlFor="grad_year">Graduation Year</Label>
                <Input 
                  id="grad_year" 
                  name="grad_year" 
                  value={form.grad_year || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <Label htmlFor="gpa">GPA</Label>
                <Input 
                  id="gpa" 
                  name="gpa" 
                  type="number" 
                  step="0.01" 
                  value={form.gpa || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <Label htmlFor="gpa_scale">GPA Scale</Label>
                <Input 
                  id="gpa_scale" 
                  name="gpa_scale" 
                  type="number" 
                  step="0.01" 
                  value={form.gpa_scale || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <Label htmlFor="sat_score">SAT Score</Label>
                <Input 
                  id="sat_score" 
                  name="sat_score" 
                  type="number" 
                  value={form.sat_score || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <Label htmlFor="act_score">ACT Score</Label>
                <Input 
                  id="act_score" 
                  name="act_score" 
                  type="number" 
                  value={form.act_score || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div className="md:col-span-2 relative">
                <Label htmlFor="majorSearchQuery_zz">Intended Major</Label>
                {/* Decoy input to defeat aggressive autofill */}
                <input 
                  type="text" 
                  name="dummyDontAutofillMajor" 
                  autoComplete="off" 
                  tabIndex={-1} 
                  aria-hidden="true" 
                  style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0}} 
                />
                <Input 
                  id="majorSearchQuery_zz" 
                  name="majorSearchQuery_zz" 
                  value={form.major || ''} 
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('🔍 Major input changed:', value);
                    setForm(prev => ({ ...prev, major: value }));
                    searchMajors(value);
                  }}
                  placeholder="Search for your intended major..."
                  autoComplete="new-password"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="words"
                  inputMode="search"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="major-typeahead-listbox"
                  aria-expanded={showMajorSuggestions}
                  data-lpignore="true"
                  data-form-type="other"
                />
                {showMajorSuggestions && majorSuggestions.length > 0 && (
                  <ul id="major-typeahead-listbox" role="listbox" className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {majorSuggestions.map((major: any) => (
                      <li
                        key={major.id}
                        role="option"
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 cursor-pointer"
                        onClick={() => {
                          console.log('🔍 Selected major:', major);
                          setForm(prev => ({ ...prev, major: major.cip_title }));
                          setShowMajorSuggestions(false);
                        }}
                      >
                        <div className="font-medium text-gray-900">{major.cip_title}</div>
                        {major.cip_code && (
                          <div className="text-sm text-gray-500">CIP Code: {major.cip_code}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="academic_interests_text">Academic Interests</Label>
                <Input 
                  id="academic_interests_text" 
                  name="academic_interests_text" 
                  placeholder="e.g., Computer Science, Biology" 
                  value={(form as any).academic_interests_text || ''} 
                  onChange={handleChange} 
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple interests with commas</p>
              </div>

              <div>
                <Label>Intended Start Term</Label>
                <Select value={form.entry_term || ''} onValueChange={(v) => handleSelectChange('entry_term', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
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
                <Select value={String(form.entry_year || '')} onValueChange={(v) => handleSelectChange('entry_year', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {startYears.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Consent */}
              <div className="md:col-span-2 flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <input 
                    id="email_opt_in" 
                    type="checkbox" 
                    name="email_opt_in" 
                    checked={form.email_opt_in} 
                    onChange={handleChange} 
                  />
                  <Label htmlFor="email_opt_in" className="cursor-pointer">
                    Colleges may email me
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    id="permission_to_text" 
                    type="checkbox" 
                    name="permission_to_text" 
                    checked={form.permission_to_text} 
                    onChange={handleChange} 
                  />
                  <Label htmlFor="permission_to_text" className="cursor-pointer">
                    Colleges may text me
                  </Label>
                </div>
              </div>

              {/* Submit */}
              <div className="md:col-span-2 mt-6">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full md:w-auto px-8"
                  size="lg"
                >
                  {submitting ? 'Submitting...' : 'Complete Registration'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}