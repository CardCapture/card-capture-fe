import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CreditCard, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { RegistrationService } from '@/services/RegistrationService';

export default function RegisterPage() {
  const [visible, setVisible] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [email, setEmail] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const submissionRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting || submissionRef.current) return;

    // Prevent duplicate submissions
    submissionRef.current = true;
    setSubmitting(true);
    try {
      await RegistrationService.startEmailRegistration(email);
      
      // Navigate to check email page
      navigate('/register/check-email', { state: { email } });
      
      toast({
        title: "Check your email",
        description: "We've sent you a secure link to complete registration.",
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
    if (!eventCode.trim() || submitting) return;

    setSubmitting(true);
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
      toast({
        title: "Error",
        description: error.message || "Invalid or expired event code",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background decorations */}
      <div className="absolute top-20 right-[10%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-[10%] w-72 h-72 bg-purple-400/5 rounded-full blur-3xl" />

      <div className={`w-full max-w-md px-6 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share Your Info Securely
          </h1>
          <p className="text-lg text-gray-600">
            Get started in seconds
          </p>
        </div>

        {/* Main options - shown when no input is active */}
        {!showEmailInput && !showCodeInput && (
          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full text-lg py-6 font-medium"
              onClick={() => setShowEmailInput(true)}
            >
              <Mail className="mr-2 h-5 w-5" />
              Continue with Email
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            <button
              className="w-full text-center text-primary hover:text-primary/80 font-medium transition-colors"
              onClick={() => setShowCodeInput(true)}
            >
              I have an Event Code
            </button>
          </div>
        )}

        {/* Email input form */}
        {showEmailInput && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-lg py-6"
                autoFocus
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEmailInput(false);
                  setEmail('');
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={submitting || !email.trim()}
                className="flex-1"
              >
                {submitting ? 'Sending...' : 'Continue'}
                {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              We'll send you a secure link to complete registration
            </p>
          </form>
        )}

        {/* Event code input form */}
        {showCodeInput && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={eventCode}
                onChange={(e) => {
                  // Only allow digits and limit to 6
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setEventCode(value);
                }}
                className="text-lg py-6 text-center font-mono tracking-wider"
                maxLength={6}
                autoFocus
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCodeInput(false);
                  setEventCode('');
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={submitting || eventCode.length !== 6}
                className="flex-1"
              >
                {submitting ? 'Verifying...' : 'Continue'}
                {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              Enter the code from your event organizer
            </p>
          </form>
        )}

        {/* Trust indicators */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              <span>Private</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>No spam</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}