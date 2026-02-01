import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RegistrationService } from '@/services/RegistrationService';
import { logger } from '@/utils/logger';

export default function CheckEmailPage() {
  const [visible, setVisible] = useState(false);
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const email = location.state?.email;
  const isReturning = location.state?.isReturning;

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }
    // Set page title and animate in
    document.title = 'Check Your Email - CardCapture';
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, [email, navigate]);

  // Analytics tracking
  useEffect(() => {
    if (email) {
      logger.log('analytics:page_view', { page: 'check_email', email_domain: email.split('@')[1] });
    }
  }, [email]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResend = async () => {
    if (!email || !canResend) return;

    logger.log('analytics:cta_click', { type: 'resend_email', email_domain: email.split('@')[1] });

    setResending(true);
    try {
      await RegistrationService.startEmailRegistration(email);
      
      toast({
        title: "Email sent",
        description: "We've sent you a new registration link.",
      });

      // Start cooldown
      setCanResend(false);
      setCountdown(60);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend email",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    logger.log('analytics:cta_click', { type: 'back_to_register' });
    navigate('/register');
  };

  if (!email) {
    return null;
  }

  return (
    <main className="relative min-h-screen flex items-center py-12 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background decorations - matching RegisterPage style */}
      <div className="absolute top-32 right-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-[15%] w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
      
      <div className="w-full mx-auto relative z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className={`space-y-8 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
            {/* Hero Section */}
            <header className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                  Check your email
                </h1>
                <div className="space-y-2">
                  <p className="text-lg text-foreground/80">
                    {isReturning
                      ? "We sent a link to update your profile to"
                      : "We sent a secure registration link to"}
                  </p>
                  <p className="text-xl font-semibold text-primary break-all">
                    {email}
                  </p>
                  {isReturning && (
                    <p className="text-sm text-foreground/60 mt-2">
                      Welcome back! Your existing information will be pre-filled.
                    </p>
                  )}
                </div>
              </div>
            </header>

            {/* Action Buttons */}
            <div className="max-w-md mx-auto">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 text-lg py-6"
                  onClick={handleBack}
                  aria-label="Go back to registration page"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <Button
                  className="flex-1 text-lg py-6"
                  onClick={handleResend}
                  disabled={resending || !canResend}
                  aria-label={resending ? 'Sending new email' : 'Resend registration email'}
                >
                  {resending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend{countdown > 0 ? ` (${countdown}s)` : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Expiry Notice */}
            <footer className="text-center pt-6">
              <p className="text-sm text-foreground/60">
                The registration link will expire in 24 hours for security.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}