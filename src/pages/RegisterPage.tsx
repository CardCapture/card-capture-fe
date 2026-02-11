import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Shield, Lock, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { RegistrationService } from '@/services/RegistrationService';
import { logger } from '@/utils/logger';

function isSchoolEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  const segments = domain.split('.');
  if (segments.includes('k12')) return true;
  if (domain.endsWith('.org')) return true;
  if (domain.endsWith('.edu')) return true;
  return false;
}

export default function RegisterPage() {
  const [visible, setVisible] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [codeError, setCodeError] = useState('');
  const submissionRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // SEO and Analytics
  useEffect(() => {
    // Set page title and meta description
    document.title = 'Student Registration - CardCapture';
    
    // Set or update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Create your student profile in seconds. One profile, used everywhere. Secure, private, and always under your control.');
    
    // Track page view
    // TODO: Replace with your analytics service
    logger.log('analytics:page_view', { page: 'register_landing' });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Debounced event code validation
  useEffect(() => {
    if (eventCode.length > 0 && eventCode.length < 6) {
      setCodeError('Code must be 6 digits');
    } else {
      setCodeError('');
    }
  }, [eventCode]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting || submissionRef.current) return;

    if (isSchoolEmail(email)) {
      setEmailError('Please use a personal email address (Gmail, Yahoo, iCloud, etc.). School and university emails often block messages from CardCapture.');
      return;
    }

    // Analytics tracking
    logger.log('analytics:cta_click', { type: 'email_registration', email_domain: email.split('@')[1] });

    submissionRef.current = true;
    setSubmitting(true);
    try {
      const result = await RegistrationService.startEmailRegistration(email);

      navigate('/register/check-email', { state: { email, isReturning: result.is_returning } });

      toast({
        title: "Check your email",
        description: result.is_returning
          ? "We've sent you a link to update your profile."
          : "We've sent you a secure link to complete registration.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send registration link",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      submissionRef.current = false;
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eventCode.length !== 6 || submitting || codeError) return;

    // Analytics tracking
    logger.log('analytics:cta_click', { type: 'event_code_verification', code_length: eventCode.length });

    setSubmitting(true);
    setCodeError('');
    try {
      const result = await RegistrationService.verifyEventCode(eventCode);
      
      if (result.redirect) {
        navigate(result.redirect);
      }
      
      toast({
        title: "Code verified",
        description: "You can now complete your registration.",
      });
    } catch (error: any) {
      const errorMessage = error.message || "Invalid or expired event code";
      setCodeError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handlePrimaryCTAClick = () => {
    logger.log('analytics:cta_click', { type: 'primary_email_cta' });
    setShowEmailInput(true);
  };
  
  const handleSecondaryCTAClick = () => {
    logger.log('analytics:cta_click', { type: 'secondary_code_cta' });
    setShowCodeInput(true);
  };
  
  const handleLearnMoreClick = () => {
    logger.log('analytics:link_click', { type: 'learn_more' });
    // Navigate to learn more page when built
    // navigate('/learn-more');
  };

  return (
    <main className="relative min-h-screen flex items-center py-12 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Background decorations - matching homepage style */}
        <div className="absolute top-32 right-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-[15%] w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
        
        <div className="w-full mx-auto relative z-10">
          <div className="max-w-2xl mx-auto px-4">
            <div className={`space-y-12 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
              {/* Hero Section */}
              <header className="text-center space-y-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                  {/* Copy options - PM can tune these */}
                  {/* Option 1: "Create Your Profile in Seconds" */}
                  {/* Option 2: "One Profile, Every College" */}
                  Create Your Profile in Seconds
                </div>
                
                {/* Headline options - PM can choose */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
                  {/* Option 1: Current */}
                  Your Info, <span className="text-primary">Your Control</span>
                  {/* Option 2: "One Profile,\n<span className=\"text-primary\">Every College</span>" */}
                  {/* Option 3: "Share Securely,\n<span className=\"text-primary\">Apply Everywhere</span>" */}
                </h1>
                
                <p className="text-xl md:text-2xl font-medium text-foreground/80 leading-relaxed max-w-2xl mx-auto">
                  {/* Supporting line options */}
                  One profile that works everywhere. Update once, share securely.
                  {/* Alt: "Create once, use everywhere. Always secure, always yours." */}
                </p>
              </header>

              {/* Primary Actions */}
              {!showEmailInput && !showCodeInput && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="space-y-4">
                    <Button
                      size="lg"
                      className="w-full text-lg py-6 font-medium"
                      onClick={handlePrimaryCTAClick}
                      aria-label="Continue with email to create your profile"
                    >
                      <Mail className="mr-2 h-5 w-5" />
                      Continue with Email
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gradient-to-br from-blue-50 via-white to-purple-50 px-3 text-foreground/60 font-medium">or</span>
                      </div>
                    </div>

                    <button
                      className="w-full text-center text-primary hover:text-primary/80 font-medium transition-colors py-2"
                      onClick={handleSecondaryCTAClick}
                      aria-label="Enter event code from your school or college fair"
                    >
                      I have an Event Code
                    </button>
                  </div>
                  
                  {/* Benefits Strip */}
                  <div className="pt-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div className="flex flex-col items-center gap-2 p-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Easy</h3>
                        <p className="text-sm text-foreground/70">Set up once, use everywhere</p>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2 p-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Yours</h3>
                        <p className="text-sm text-foreground/70">You control and update your data</p>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2 p-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Secure</h3>
                        <p className="text-sm text-foreground/70">Privacy-first, encrypted sharing</p>
                      </div>
                    </div>
                    
                    <div className="text-center mt-6">
                      <button
                        onClick={handleLearnMoreClick}
                        className="text-primary hover:text-primary/80 font-medium transition-colors text-sm"
                        aria-label="Learn more about how student profiles work"
                      >
                        Learn more →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Input Form */}
              {showEmailInput && (
                <div className="max-w-md mx-auto">
                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="email-input" className="block text-sm font-medium text-foreground/80">
                        Email Address
                      </label>
                      <Input
                        id="email-input"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError('');
                        }}
                        onBlur={() => {
                          if (email.trim() && isSchoolEmail(email)) {
                            setEmailError('Please use a personal email address (Gmail, Yahoo, iCloud, etc.). School and university emails often block messages from CardCapture.');
                          }
                        }}
                        className={`text-lg py-6 ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        autoFocus
                        required
                        aria-describedby="email-help"
                        aria-invalid={!!emailError}
                      />
                      <p id="email-help" className={`text-xs ${emailError ? 'text-destructive' : 'text-foreground/60'}`} role={emailError ? 'alert' : undefined}>
                        Use a personal email like Gmail or Yahoo — school emails often don't receive our messages
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowEmailInput(false);
                          setEmail('');
                          setEmailError('');
                        }}
                        className="flex-1"
                        aria-label="Go back to main options"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || !email.trim() || !!emailError}
                        className="flex-1"
                        aria-label={submitting ? 'Sending magic link to your email' : 'Send magic link to continue'}
                      >
                        {submitting ? 'Sending...' : 'Continue'}
                        {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Event Code Input Form */}
              {showCodeInput && (
                <div className="max-w-md mx-auto">
                  <form onSubmit={handleCodeSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="code-input" className="block text-sm font-medium text-foreground/80">
                        Event Code
                      </label>
                      <Input
                        id="code-input"
                        type="text"
                        placeholder="123456"
                        value={eventCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setEventCode(value);
                        }}
                        className={`text-lg py-6 text-center font-mono tracking-wider ${
                          codeError ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        maxLength={6}
                        autoFocus
                        required
                        aria-describedby="code-help code-error"
                        aria-invalid={!!codeError}
                      />
                      {codeError && (
                        <p id="code-error" className="text-xs text-destructive" role="alert">
                          {codeError}
                        </p>
                      )}
                      <p id="code-help" className="text-xs text-foreground/60">
                        Enter the 6-digit code from your school or college fair
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCodeInput(false);
                          setEventCode('');
                          setCodeError('');
                        }}
                        className="flex-1"
                        aria-label="Go back to main options"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || eventCode.length !== 6 || !!codeError}
                        className="flex-1"
                        aria-label={submitting ? 'Verifying your event code' : 'Verify event code to continue'}
                      >
                        {submitting ? 'Verifying...' : 'Continue'}
                        {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Trust Indicators */}
              <footer className="mt-12 pt-8 border-t border-foreground/10">
                <div className="flex items-center justify-center gap-8 text-sm text-foreground/60 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Secure & Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span>Privacy First</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>No Spam Ever</span>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </main>
    );
}