import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RegistrationService } from '@/services/RegistrationService';

export default function CheckEmailPage() {
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }
  }, [email, navigate]);

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

  const getEmailDomain = (email: string) => {
    return email.split('@')[1]?.toLowerCase();
  };

  const getEmailProviderUrl = (domain: string) => {
    const providers: Record<string, string> = {
      'gmail.com': 'https://gmail.com',
      'yahoo.com': 'https://mail.yahoo.com',
      'hotmail.com': 'https://outlook.live.com',
      'outlook.com': 'https://outlook.live.com',
      'icloud.com': 'https://www.icloud.com/mail',
    };
    return providers[domain];
  };

  if (!email) {
    return null;
  }

  const domain = getEmailDomain(email);
  const providerUrl = domain ? getEmailProviderUrl(domain) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-gray-600 mb-2">
            We sent a secure registration link to
          </p>
          <p className="font-medium text-gray-900">
            {email}
          </p>
        </div>

        <div className="space-y-4">
          {providerUrl && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => window.open(providerUrl, '_blank')}
            >
              Open {domain?.split('.')[0]}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleResend}
              disabled={resending || !canResend}
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

            <Link to="/register">
              <Button variant="outline" className="px-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">
            Didn't receive the email?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check your spam folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• The link expires in 24 hours</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            The registration link will expire in 24 hours for security.
          </p>
        </div>
      </div>
    </div>
  );
}