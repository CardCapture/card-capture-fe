import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RegistrationService } from '@/services/RegistrationService';
import { logger } from '@/utils/logger';

function formatPhoneDisplay(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function CheckPhonePage() {
  const [visible, setVisible] = useState(false);
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const phone = location.state?.phone;
  const isReturning = location.state?.isReturning;

  useEffect(() => {
    if (!phone) {
      navigate('/register');
      return;
    }
    document.title = 'Check Your Phone - CardCapture';
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, [phone, navigate]);

  useEffect(() => {
    if (phone) {
      logger.log('analytics:page_view', { page: 'check_phone' });
    }
  }, [phone]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResend = async () => {
    if (!phone || !canResend) return;

    logger.log('analytics:cta_click', { type: 'resend_sms' });

    setResending(true);
    try {
      await RegistrationService.startSmsRegistration(phone);

      toast({
        title: "Text sent",
        description: "We've sent you a new registration link.",
      });

      setCanResend(false);
      setCountdown(60);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend text",
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

  if (!phone) {
    return null;
  }

  return (
    <main className="relative min-h-screen flex items-center py-12 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="absolute top-32 right-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-[15%] w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />

      <div className="w-full mx-auto relative z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className={`space-y-8 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
            <header className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                <Smartphone className="w-10 h-10 text-primary" />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                  Check your phone
                </h1>
                <div className="space-y-2">
                  <p className="text-lg text-foreground/80">
                    {isReturning
                      ? "We texted a link to update your profile to"
                      : "We texted a secure registration link to"}
                  </p>
                  <p className="text-xl font-semibold text-primary">
                    {formatPhoneDisplay(phone)}
                  </p>
                  {isReturning && (
                    <p className="text-sm text-foreground/60 mt-2">
                      Welcome back! Your existing information will be pre-filled.
                    </p>
                  )}
                </div>
              </div>
            </header>

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
                  aria-label={resending ? 'Sending new text' : 'Resend registration text'}
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
