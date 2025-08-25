import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RegistrationService } from '@/services/RegistrationService';
import { useToast } from '@/hooks/use-toast';

export default function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid registration link');
      return;
    }

    verifyMagicLink();
  }, [token]);

  const verifyMagicLink = async () => {
    if (!token) return;

    try {
      const result = await RegistrationService.verifyMagicLink(token);
      
      if (result.success) {
        setStatus('success');
        
        // Redirect to form after a short delay
        setTimeout(() => {
          navigate(result.redirect || '/register/form');
        }, 1500);

        toast({
          title: "Email verified",
          description: "Redirecting to registration form...",
        });
      } else {
        setStatus('error');
        setMessage('Verification failed');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Invalid or expired registration link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-6">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  Verifying your link...
                </h1>
                <p className="text-gray-600">
                  Please wait while we verify your registration link.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  Link Verified!
                </h1>
                <p className="text-gray-600 mb-4">
                  Your email has been verified. Redirecting to registration form...
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span>Redirecting...</span>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  Link Invalid or Expired
                </h1>
                <p className="text-gray-600 mb-6">
                  {message || 'This registration link is invalid or has expired.'}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">
                    What happened?
                  </h3>
                  <ul className="text-sm text-gray-600 text-left space-y-1">
                    <li>• The link has expired (links expire in 24 hours)</li>
                    <li>• The link has already been used</li>
                    <li>• The link is malformed</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/register')}
                  >
                    Get a New Registration Link
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/')}
                  >
                    Back to Home
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}