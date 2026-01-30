/**
 * Recruiter self-service signup page.
 * Two-step flow: 1) School selection, 2) Account details
 * After account creation, redirects to event selection.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Building2, User, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
import recruiterSignupService, { School } from '@/services/RecruiterSignupService';

type Step = 'school' | 'account';

interface SchoolSelection {
  type: 'existing' | 'new';
  schoolId?: string;
  schoolName?: string;
  isSelfAdmin?: boolean;
  adminEmail?: string;
  adminFirstName?: string;
  adminLastName?: string;
}

const RecruiterSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('school');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // School selection state
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolSelection, setSchoolSelection] = useState<SchoolSelection | null>(null);
  const [schoolPopoverOpen, setSchoolPopoverOpen] = useState(false);
  const [showNewSchoolInput, setShowNewSchoolInput] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');

  // Account details state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Admin invite state (for new schools)
  const [isSelfAdmin, setIsSelfAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');

  // Load schools on mount
  useEffect(() => {
    const loadSchools = async () => {
      try {
        setSchoolsLoading(true);
        const response = await recruiterSignupService.getSchools();
        setSchools(response.schools);
      } catch (err) {
        logger.error('Failed to load schools:', err);
        setError('Failed to load schools. Please try again.');
      } finally {
        setSchoolsLoading(false);
      }
    };
    loadSchools();
  }, []);

  // Filter schools based on search query
  const filteredSchools = useMemo(() => {
    if (!schoolSearchQuery) return schools;
    const query = schoolSearchQuery.toLowerCase();
    return schools.filter(school =>
      school.name.toLowerCase().includes(query)
    );
  }, [schools, schoolSearchQuery]);

  // Get selected school name for display
  const selectedSchoolName = useMemo(() => {
    if (showNewSchoolInput) return newSchoolName || '';
    if (!schoolSelection) return '';
    if (schoolSelection.type === 'new') return schoolSelection.schoolName || '';
    const school = schools.find(s => s.id === schoolSelection.schoolId);
    return school?.name || '';
  }, [schoolSelection, schools, showNewSchoolInput, newSchoolName]);

  const handleSchoolSelect = (school: School) => {
    setSchoolSelection({
      type: 'existing',
      schoolId: school.id,
      schoolName: school.name,
    });
    setSchoolPopoverOpen(false);
  };

  const handleMySchoolNotListed = () => {
    setShowNewSchoolInput(true);
    setSchoolSelection(null);
    setSchoolPopoverOpen(false);
  };

  const handleBackToSchoolSearch = () => {
    setShowNewSchoolInput(false);
    setNewSchoolName('');
    setSchoolSelection(null);
  };

  const handleSchoolContinue = () => {
    // If in new school mode, validate the new school name
    if (showNewSchoolInput) {
      if (!newSchoolName.trim()) {
        setError('Please enter your school name');
        return;
      }
      setSchoolSelection({
        type: 'new',
        schoolName: newSchoolName.trim(),
      });
    } else if (!schoolSelection) {
      setError('Please select a school');
      return;
    }
    setError(null);
    setStep('account');
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate admin email for new schools (only if not self-admin)
    if (schoolSelection?.type === 'new' && !isSelfAdmin) {
      if (!adminEmail.trim()) {
        setError('Please enter your admin\'s email address');
        return;
      }
    }

    setLoading(true);

    try {
      // Store signup data in sessionStorage for the event selection page
      const signupData = {
        email,
        password,
        firstName,
        lastName,
        schoolSelection: {
          type: schoolSelection!.type,
          school_id: schoolSelection!.schoolId,
          school_name: schoolSelection!.schoolName,
          is_self_admin: isSelfAdmin,
          admin_email: !isSelfAdmin ? adminEmail || undefined : undefined,
          admin_first_name: !isSelfAdmin ? adminFirstName || undefined : undefined,
          admin_last_name: !isSelfAdmin ? adminLastName || undefined : undefined,
        },
      };
      sessionStorage.setItem('recruiterSignupData', JSON.stringify(signupData));

      // Navigate to event selection
      navigate('/signup/select-event');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSchoolStep = () => (
    <Card className="w-full border-muted-foreground/20 shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-medium">1</span>
          <span>of 2</span>
        </div>
        <CardTitle className="text-2xl font-bold">
          Select Your School
        </CardTitle>
        <CardDescription>
          Search for your school or add a new one if it's not listed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showNewSchoolInput ? (
          // School dropdown search
          <div className="space-y-2">
            <Label>School</Label>
            <Popover open={schoolPopoverOpen} onOpenChange={setSchoolPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={schoolPopoverOpen}
                  className="w-full justify-between h-11 font-normal"
                  disabled={schoolsLoading}
                >
                  {schoolsLoading ? (
                    <span className="text-muted-foreground">Loading schools...</span>
                  ) : selectedSchoolName ? (
                    <span className="truncate">{selectedSchoolName}</span>
                  ) : (
                    <span className="text-muted-foreground">Search for your school...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search schools..."
                    value={schoolSearchQuery}
                    onValueChange={setSchoolSearchQuery}
                  />
                  <CommandList>
                    {/* My school isn't listed option - always at top */}
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleMySchoolNotListed}
                        className="cursor-pointer border-b"
                      >
                        <span className="mr-2 h-4 w-4" />
                        <span className="text-primary font-medium">My school isn't listed</span>
                      </CommandItem>
                    </CommandGroup>
                    <CommandGroup>
                      {filteredSchools.slice(0, 50).map((school) => (
                        <CommandItem
                          key={school.id}
                          value={school.id}
                          onSelect={() => handleSchoolSelect(school)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              schoolSelection?.schoolId === school.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{school.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          // New school text input
          <div className="space-y-2">
            <Label htmlFor="newSchool">Enter School Name</Label>
            <Input
              id="newSchool"
              placeholder="Enter your school name"
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              We'll create a new school account for you
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBackToSchoolSearch}
              className="text-xs px-0 h-auto"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back to school search
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          onClick={handleSchoolContinue}
          className="w-full"
          size="lg"
          disabled={!showNewSchoolInput && !schoolSelection}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );

  const renderAccountStep = () => (
    <Card className="w-full border-muted-foreground/20 shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-medium">2</span>
          <span>of 2</span>
        </div>
        <CardTitle className="text-2xl font-bold">
          Create Your Account
        </CardTitle>
        <CardDescription>
          Enter your details to complete registration
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleAccountSubmit}>
        <CardContent className="space-y-4">
          {/* Selected school display */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{selectedSchoolName}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs"
              onClick={() => setStep('school')}
            >
              Change
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.smith@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Admin section - only show for new schools */}
          {schoolSelection?.type === 'new' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
              {/* Toggle: I'm the admin */}
              <div className="flex items-center justify-between">
                <Label htmlFor="isSelfAdmin" className="text-sm font-medium cursor-pointer">
                  I'm the admin for this school
                </Label>
                <Switch
                  id="isSelfAdmin"
                  checked={isSelfAdmin}
                  onCheckedChange={setIsSelfAdmin}
                  disabled={loading}
                />
              </div>

              {/* Admin invite fields - hidden if they are the admin */}
              {!isSelfAdmin && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-blue-900">
                      Who is your department admin?
                    </Label>
                    <p className="text-xs text-blue-700 mb-3">
                      We'll send them an invite so they can manage your school's account.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Admin first name"
                        value={adminFirstName}
                        onChange={(e) => setAdminFirstName(e.target.value)}
                        disabled={loading}
                      />
                      <Input
                        placeholder="Admin last name"
                        value={adminLastName}
                        onChange={(e) => setAdminLastName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="Admin email address"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('school')}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Continue to Event Selection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">CC</span>
            </div>
            <span className="font-bold text-2xl tracking-tight">CardCapture</span>
          </Link>
        </div>

        {step === 'school' && renderSchoolStep()}
        {step === 'account' && renderAccountStep()}
      </div>
    </div>
  );
};

export default RecruiterSignupPage;
