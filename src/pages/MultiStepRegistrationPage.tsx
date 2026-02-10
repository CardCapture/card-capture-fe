import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import { FormStep } from '@/components/ui/form-step';
import { FormInput } from '@/components/ui/form-input';
import { SmartDateInput } from '@/components/ui/smart-date-input';
import { SmartPhoneInput } from '@/components/ui/smart-phone-input';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { MultiSelectAutocomplete } from '@/components/ui/multi-select-autocomplete';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePersistentForm } from '@/hooks/use-persistent-form';
import { RegistrationService } from '@/services/RegistrationService';
import { validators, combineValidators } from '@/utils/validation';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface MajorItem {
  id: string | number;
  label: string;
  value?: string;
}

interface RegistrationFormData {
  // Step 1: Personal Info
  first_name: string;
  last_name: string;
  preferred_first_name: string;
  date_of_birth: string;

  // Step 2: Contact Info
  email: string;
  cell: string;
  address: string;
  address_2: string;
  city: string;
  state: string;
  zip_code: string;

  // Step 3: School Info
  student_type: string;
  high_school: string;
  grade_level: string;
  grad_year: string;
  gpa: string;
  gpa_scale: string;
  sat_score: string;
  act_score: string;

  // Step 4: Academic Interests
  entry_term: string;
  entry_year: string;
  major: string;
  academic_interests: MajorItem[];
  email_opt_in: boolean;
  permission_to_text: boolean;
}

const initialFormData: RegistrationFormData = {
  first_name: '',
  last_name: '',
  preferred_first_name: '',
  date_of_birth: '',
  email: '',
  cell: '',
  address: '',
  address_2: '',
  city: '',
  state: '',
  zip_code: '',
  student_type: '',
  high_school: '',
  grade_level: '',
  grad_year: '',
  gpa: '',
  gpa_scale: '4.0',
  sat_score: '',
  act_score: '',
  entry_term: '',
  entry_year: '',
  major: '',
  academic_interests: [],
  email_opt_in: true,
  permission_to_text: false,
};

const steps = [
  'Personal Info',
  'Contact Info', 
  'School Info',
  'Academic Interests'
];

const states = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const gradeLevels = ["9", "10", "11", "12", "College Transfer"];
const terms = ["Fall", "Spring", "Summer", "Winter"];
const gpaScales = ["4.0", "5.0", "100"];

export default function MultiStepRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Add search states for typeahead
  const [schoolSuggestions, setSchoolSuggestions] = useState<any[]>([]);
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const [majorSuggestions, setMajorSuggestions] = useState<any[]>([]);
  const [showMajorSuggestions, setShowMajorSuggestions] = useState(false);

  // Search function for schools
  const searchSchools = async (query: string) => {
    if (query.length < 2) {
      setSchoolSuggestions([]);
      setShowSchoolSuggestions(false);
      return;
    }

    try {
      logger.log('🔍 Searching schools for:', query, 'in state:', formData.state);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      // Add state parameter if available to prioritize local schools
      const stateParam = formData.state ? `&state=${encodeURIComponent(formData.state)}` : '';
      const searchUrl = `${API_BASE_URL}/high_schools/search?q=${encodeURIComponent(query)}&limit=10${stateParam}`;

      logger.log('🔍 Location-aware search URL:', searchUrl);
      const response = await fetch(searchUrl);
      const data = await response.json();
      logger.log('🔍 School search results:', data);
      setSchoolSuggestions(data.results || []);
      setShowSchoolSuggestions(true);
    } catch (error) {
      logger.error('🔍 School search error:', error);
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
      logger.log('🔍 Searching majors for:', query);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/majors/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      logger.log('🔍 Major search results:', data);
      setMajorSuggestions(data.results || []);
      setShowMajorSuggestions(true);
    } catch (error) {
      logger.error('🔍 Major search error:', error);
      setMajorSuggestions([]);
      setShowMajorSuggestions(false);
    }
  };

  // Search function for academic interests (uses same majors API)
  const searchAcademicInterests = async (query: string): Promise<any[]> => {
    if (query.length < 2) {
      return [];
    }

    try {
      logger.log('🔍 Searching academic interests for:', query);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/majors/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      logger.log('🔍 Academic interests search results:', data);
      return data.results || [];
    } catch (error) {
      logger.error('🔍 Academic interests search error:', error);
      return [];
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: formData, updateData, clearData, isLoaded } = usePersistentForm({
    key: 'cardcapture-registration',
    initialData: initialFormData
  });

  const currentYear = new Date().getFullYear();
  const entryYears = Array.from({ length: 7 }, (_, i) => String(currentYear + i));
  const gradYears = Array.from({ length: 10 }, (_, i) => String(currentYear + i));

  useEffect(() => {
    checkSession();
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Close school dropdown if clicking outside
      if (showSchoolSuggestions) {
        const schoolDropdown = document.querySelector('[data-dropdown="school-suggestions"]');
        const schoolInput = document.querySelector('[aria-controls="institution-typeahead-listbox"]');

        if (schoolDropdown && !schoolDropdown.contains(target) &&
            schoolInput && !schoolInput.contains(target)) {
          setShowSchoolSuggestions(false);
        }
      }

      // Close major dropdown if clicking outside
      if (showMajorSuggestions) {
        const majorDropdown = document.querySelector('[data-dropdown="major-suggestions"]');
        const majorInput = document.querySelector('[aria-controls="major-typeahead-listbox"]');

        if (majorDropdown && !majorDropdown.contains(target) &&
            majorInput && !majorInput.contains(target)) {
          setShowMajorSuggestions(false);
        }
      }
    };

    // Use capture phase to handle before any other handlers
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [showSchoolSuggestions, showMajorSuggestions]);

  const checkSession = async () => {
    try {
      const sessionData = await RegistrationService.getFormSession();
      setSession(sessionData);

      // Pre-fill from existing student data if returning user
      if (sessionData.existing_student) {
        const student = sessionData.existing_student;
        updateData({
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          preferred_first_name: student.preferred_first_name || '',
          date_of_birth: student.date_of_birth || '',
          email: student.email || sessionData.email || '',
          cell: student.cell || '',
          address: student.address || '',
          address_2: student.address_2 || '',
          city: student.city || '',
          state: student.state || '',
          zip_code: student.zip_code || '',
          student_type: student.student_type || '',
          high_school: student.high_school || '',
          grade_level: student.grade_level || '',
          grad_year: student.grad_year || '',
          gpa: student.gpa?.toString() || '',
          gpa_scale: student.gpa_scale?.toString() || '4.0',
          sat_score: student.sat_score?.toString() || '',
          act_score: student.act_score?.toString() || '',
          entry_term: student.entry_term || '',
          entry_year: student.entry_year?.toString() || '',
          major: student.major || '',
          // Convert string array to {id, label} objects for MultiSelectAutocomplete
          academic_interests: (student.academic_interests || []).map((interest: string | { id: string; label: string }) =>
            typeof interest === 'string' ? { id: interest, label: interest } : interest
          ),
          email_opt_in: student.email_opt_in ?? true,
          permission_to_text: student.permission_to_text ?? false,
        });
        toast({
          title: "Welcome back!",
          description: "Your information has been pre-filled. Update anything you'd like.",
        });
      } else if (sessionData.email) {
        // New user - just pre-fill email
        updateData({ email: sessionData.email });
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

  const validateStep = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 0: // Personal Info
        if (!formData.first_name.trim()) errors.push('First name is required');
        if (!formData.last_name.trim()) errors.push('Last name is required');
        if (!formData.date_of_birth) errors.push('Date of birth is required');
        break;
        
      case 1: // Contact Info
        if (!formData.email.trim()) errors.push('Email is required');
        if (formData.email && validators.email(formData.email)) errors.push('Valid email is required');
        if (formData.cell && validators.phone(formData.cell)) errors.push('Valid phone number is required');
        if (formData.zip_code && validators.zipCode(formData.zip_code)) errors.push('Valid zip code is required');
        break;
        
      case 2: // School Info
        if (formData.gpa && validators.gpa(formData.gpa)) errors.push('Valid GPA is required');
        if (formData.sat_score && validators.testScore(formData.sat_score, 'SAT')) errors.push('Valid SAT score is required');
        if (formData.act_score && validators.testScore(formData.act_score, 'ACT')) errors.push('Valid ACT score is required');
        if (formData.grad_year && validators.graduationYear(formData.grad_year)) errors.push('Valid graduation year is required');
        break;
        
      case 3: // Academic Interests - no required fields
        break;
    }

    return errors;
  };

  const canContinue = (step: number): boolean => {
    const errors = validateStep(step);
    setStepErrors(prev => ({ ...prev, [step]: errors }));
    return errors.length === 0;
  };

  const nextStep = () => {
    if (canContinue(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!canContinue(currentStep)) return;

    setSubmitting(true);

    try {
      // Prepare form data for submission
      const submissionData = {
        ...formData,
        academic_interests: formData.academic_interests?.map(item => item.label) || [],
        gpa: formData.gpa ? parseFloat(formData.gpa) : undefined,
        gpa_scale: formData.gpa_scale ? parseFloat(formData.gpa_scale) : undefined,
        sat_score: formData.sat_score ? parseInt(formData.sat_score) : undefined,
        act_score: formData.act_score ? parseInt(formData.act_score) : undefined,
        entry_year: formData.entry_year ? parseInt(formData.entry_year) : undefined,
      };

      const result = await RegistrationService.submitRegistration(submissionData);
      
      // Clear saved form data
      clearData();
      
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

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isEmailLocked = session?.session_type === 'magic_link';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 px-4">
      <div className="container mx-auto max-w-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
            Join CardCapture
          </h1>
          <p className="text-gray-600 text-lg">
            Let's get you connected with your dream schools
          </p>
        </div>

        {/* Progress Stepper */}
        <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

        {/* Form Card */}
        <Card className="relative overflow-hidden shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <style>{`
              input:-webkit-autofill,
              input:-webkit-autofill:hover,
              input:-webkit-autofill:focus,
              input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 30px white inset !important;
                -webkit-text-fill-color: inherit !important;
                transition: background-color 5000s ease-in-out 0s !important;
              }
              input[data-autocompleted] {
                background-color: transparent !important;
              }
              form[autocomplete="off"] input:not([type="submit"]):not([type="hidden"]) {
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
              }
            `}</style>
            <form autoComplete="off" data-lpignore="true" data-form-type="other">
            <div className="relative min-h-[500px]">
              
              {/* Step 1: Personal Info */}
              <FormStep
                title="First, tell us about you"
                subtitle="We'll keep this info secure and only share what you approve"
                isActive={currentStep === 0}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={(e) => updateData({ first_name: e.target.value })}
                    onValidate={combineValidators(validators.required, validators.name)}
                    placeholder="Alex"
                    required
                    autoComplete="given-name"
                  />
                  <FormInput
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={(e) => updateData({ last_name: e.target.value })}
                    onValidate={combineValidators(validators.required, validators.name)}
                    placeholder="Smith"
                    required
                    autoComplete="family-name"
                  />
                </div>
                
                <FormInput
                  label="Preferred Name"
                  name="preferred_first_name"
                  value={formData.preferred_first_name}
                  onChange={(e) => updateData({ preferred_first_name: e.target.value })}
                  placeholder="What should we call you? (optional)"
                  helpText="If different from your first name"
                  autoComplete="nickname"
                />
                
                <SmartDateInput
                  label="Date of Birth"
                  value={formData.date_of_birth}
                  onChange={(value) => updateData({ date_of_birth: value })}
                  onValidate={validators.required}
                  required
                />
              </FormStep>

              {/* Step 2: Contact Info */}
              <FormStep
                title="How can schools reach you?"
                subtitle="Your contact info helps schools send you personalized information"
                isActive={currentStep === 1}
              >
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateData({ email: e.target.value })}
                  onValidate={combineValidators(validators.required, validators.email)}
                  placeholder="alex@email.com"
                  required
                  disabled={isEmailLocked}
                  autoComplete="email"
                  helpText={isEmailLocked ? "Verified via magic link" : undefined}
                />
                
                <SmartPhoneInput
                  label="Phone Number"
                  value={formData.cell}
                  onChange={(value) => updateData({ cell: value })}
                  onValidate={validators.phone}
                  helpText="For important updates from schools"
                />
                
                <div className="space-y-4">
                  <AddressAutocomplete
                    label="Street Address"
                    value={formData.address}
                    onChange={(value) => updateData({ address: value })}
                    onAddressSelect={(address) => updateData({
                      address: address.street,
                      address_2: address.street2,
                      city: address.city,
                      state: address.state,
                      zip_code: address.zipCode
                    })}
                    helpText="Start typing and select from suggestions to auto-fill all address fields"
                  />
                  
                  <FormInput
                    label="Address Line 2"
                    name="address_2"
                    value={formData.address_2}
                    onChange={(e) => updateData({ address_2: e.target.value })}
                    placeholder="Apt 4B, Suite 100, etc. (optional)"
                    autoComplete="address-line2"
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={(e) => updateData({ city: e.target.value })}
                      placeholder="Austin"
                      autoComplete="address-level2"
                    />
                    
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => updateData({ state: value })}
                      >
                        <SelectTrigger className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base h-12 !bg-white">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <FormInput
                      label="ZIP Code"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => updateData({ zip_code: e.target.value })}
                      onValidate={validators.zipCode}
                      placeholder="78701"
                      autoComplete="postal-code"
                    />
                  </div>
                </div>
              </FormStep>

              {/* Step 3: School Info */}
              <FormStep
                title="Tell us about your academics"
                subtitle="This helps us match you with the right programs"
                isActive={currentStep === 2}
              >
                <div className="relative">
                  {/* Multiple decoy inputs for maximum browser confusion */}
                  <input 
                    type="email" 
                    name="fakeEmail_decoy_99" 
                    autoComplete="new-password" 
                    tabIndex={-1} 
                    aria-hidden="true" 
                    style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, visibility: 'hidden'}} 
                  />
                  <input 
                    type="text" 
                    name="dummySchoolDecoy_xz" 
                    autoComplete="chrome-off" 
                    tabIndex={-1} 
                    aria-hidden="true" 
                    style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, visibility: 'hidden'}} 
                  />
                  <input 
                    type="search" 
                    name="search_decoy_aa" 
                    autoComplete="off" 
                    tabIndex={-1} 
                    aria-hidden="true" 
                    style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, visibility: 'hidden'}} 
                  />
                  <FormInput
                    label="Current School"
                    name={`inst_query_${Math.random().toString(36).substr(2, 9)}`}
                    id={`inst_query_${Math.random().toString(36).substr(2, 9)}`}
                    value={formData.high_school}
                    onChange={(e) => {
                      const value = e.target.value;
                      logger.log('🔍 High school input changed:', value);
                      updateData({ high_school: value });
                      searchSchools(value);
                    }}
                    placeholder="Search for your high school..."
                    autoComplete="one-time-code"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                    inputMode="search"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls="institution-typeahead-listbox"
                    aria-expanded={showSchoolSuggestions}
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-dashlane-ignore="true"
                    data-keeper-ignore="true"
                    data-bitwarden-ignore="true"
                    data-lastpass-ignore="true"
                    data-roboform-ignore="true"
                    data-autocomplete="nope"
                    autoFocus={false}
                    readOnly={false}
                    onFocus={(e) => {
                      e.target.removeAttribute('readonly');
                    }}
                  />
                  {showSchoolSuggestions && schoolSuggestions.length > 0 && (
                    <div
                      data-dropdown="school-suggestions"
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {schoolSuggestions.map((school: any) => (
                        <button
                          key={school.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            logger.log('🔍 Selected school:', school);
                            updateData({ high_school: school.name });
                            setShowSchoolSuggestions(false);
                          }}
                        >
                          <div className="font-medium text-gray-900">{school.name}</div>
                          {school.city && school.state && (
                            <div className="text-sm text-gray-500">{school.city}, {school.state}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grade Level</Label>
                    <Select
                      value={formData.grade_level}
                      onValueChange={(value) => updateData({ grade_level: value, student_type: value === 'College Transfer' ? 'Transfer' : 'Freshman' })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradeLevels.map(grade => (
                          <SelectItem key={grade} value={grade}>
                            {grade === "College Transfer" ? grade : `Grade ${grade}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{formData.grade_level === 'College Transfer' ? 'HS Graduation Year' : 'Graduation Year'}</Label>
                    <Select
                      value={formData.grad_year}
                      onValueChange={(value) => updateData({ grad_year: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="GPA"
                    name="gpa"
                    value={formData.gpa}
                    onChange={(e) => updateData({ gpa: e.target.value })}
                    onValidate={validators.gpa}
                    placeholder="3.75"
                    helpText="We ask to match you with the right programs — this won't be shared publicly"
                  />
                  
                  <div className="space-y-2">
                    <Label>GPA Scale</Label>
                    <Select
                      value={formData.gpa_scale}
                      onValueChange={(value) => updateData({ gpa_scale: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gpaScales.map(scale => (
                          <SelectItem key={scale} value={scale}>{scale} Scale</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="SAT Score"
                    name="sat_score"
                    value={formData.sat_score}
                    onChange={(e) => updateData({ sat_score: e.target.value })}
                    onValidate={(value) => validators.testScore(value, 'SAT')}
                    placeholder="1200 (optional)"
                  />
                  
                  <FormInput
                    label="ACT Score"
                    name="act_score"
                    value={formData.act_score}
                    onChange={(e) => updateData({ act_score: e.target.value })}
                    onValidate={(value) => validators.testScore(value, 'ACT')}
                    placeholder="28 (optional)"
                  />
                </div>
              </FormStep>

              {/* Step 4: Academic Interests */}
              <FormStep
                title="What are you passionate about?"
                subtitle="Help schools understand your interests and goals"
                isActive={currentStep === 3}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>When do you plan to start?</Label>
                    <Select
                      value={formData.entry_term}
                      onValueChange={(value) => updateData({ entry_term: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map(term => (
                          <SelectItem key={term} value={term}>{term}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Start Year</Label>
                    <Select
                      value={formData.entry_year}
                      onValueChange={(value) => updateData({ entry_year: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {entryYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="relative">
                  {/* Multiple decoy inputs for maximum browser confusion */}
                  <input 
                    type="email" 
                    name="fakeMajorEmail_decoy_77" 
                    autoComplete="new-password" 
                    tabIndex={-1} 
                    aria-hidden="true" 
                    style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, visibility: 'hidden'}} 
                  />
                  <input 
                    type="text" 
                    name="dummyMajorDecoy_bb" 
                    autoComplete="chrome-off" 
                    tabIndex={-1} 
                    aria-hidden="true" 
                    style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, visibility: 'hidden'}} 
                  />
                  <input 
                    type="search" 
                    name="major_search_decoy_cc" 
                    autoComplete="off" 
                    tabIndex={-1} 
                    aria-hidden="true" 
                    style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, visibility: 'hidden'}} 
                  />
                  <FormInput
                    label="Intended Major"
                    name={`major_query_${Math.random().toString(36).substr(2, 9)}`}
                    id={`major_query_${Math.random().toString(36).substr(2, 9)}`}
                    value={formData.major}
                    onChange={(e) => {
                      const value = e.target.value;
                      logger.log('🔍 Major input changed:', value);
                      updateData({ major: value });
                      searchMajors(value);
                    }}
                    placeholder="Search for your intended major..."
                    autoComplete="one-time-code"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                    inputMode="search"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls="major-typeahead-listbox"
                    aria-expanded={showMajorSuggestions}
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-dashlane-ignore="true"
                    data-keeper-ignore="true"
                    data-bitwarden-ignore="true"
                    data-lastpass-ignore="true"
                    data-roboform-ignore="true"
                    data-autocomplete="nope"
                    autoFocus={false}
                    readOnly={false}
                    onFocus={(e) => {
                      e.target.removeAttribute('readonly');
                    }}
                  />
                  {showMajorSuggestions && majorSuggestions.length > 0 && (
                    <div
                      data-dropdown="major-suggestions"
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {majorSuggestions.map((major: any) => (
                        <button
                          key={major.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            logger.log('🔍 Selected major:', major);
                            updateData({ major: major.display_name || major.cip_title });
                            setShowMajorSuggestions(false);
                          }}
                        >
                          <div className="font-medium text-gray-900">{major.display_name || major.cip_title}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <MultiSelectAutocomplete
                  label="Academic Interests"
                  value={formData.academic_interests || []}
                  onChange={(items) => updateData({ academic_interests: items })}
                  onSearch={searchAcademicInterests}
                  mapResultToItem={(result) => ({
                    id: result.id,
                    label: result.display_name || result.cip_title,
                    value: result.cip_code,
                  })}
                  placeholder="Search for majors you're interested in..."
                  helpText="Search and select multiple majors you're interested in studying"
                />
                
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">Communication Preferences</h3>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="email_opt_in"
                      checked={formData.email_opt_in}
                      onCheckedChange={(checked) => updateData({ email_opt_in: !!checked })}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="email_opt_in" className="text-sm font-medium cursor-pointer">
                        Email updates
                      </Label>
                      <p className="text-sm text-gray-600">
                        Receive information from schools and college fair updates
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="permission_to_text"
                      checked={formData.permission_to_text}
                      onCheckedChange={(checked) => updateData({ permission_to_text: !!checked })}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="permission_to_text" className="text-sm font-medium cursor-pointer">
                        Text messages
                      </Label>
                      <p className="text-sm text-gray-600">
                        Get important reminders and time-sensitive updates via SMS
                      </p>
                    </div>
                  </div>
                </div>
              </FormStep>
            </div>
            </form>

            {/* Error Messages */}
            {stepErrors[currentStep]?.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {stepErrors[currentStep].map((error, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-wrap justify-between items-center gap-3 mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-3 sm:px-6 py-3"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-3 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-3 sm:px-6 py-3 min-w-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="truncate">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span className="truncate">Complete Registration</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8 text-sm text-gray-500">
          Your progress is automatically saved as you go
        </div>
      </div>
    </div>
  );
}