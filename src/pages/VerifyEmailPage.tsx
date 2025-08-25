import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RegistrationService } from '@/services/RegistrationService';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    if (!token) return;

    try {
      const result = await RegistrationService.verifyEmail(token);
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage('Verification failed');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 px-6">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  Verifying your email...
                </h1>
                <p className="text-gray-600">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  Email Verified!
                </h1>
                <p className="text-gray-600 mb-6">
                  {message || 'Your email has been successfully verified.'}
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Your registration is now complete
                    </span>
                  </div>
                </div>

                <Link to="/">
                  <Button className="w-full" size="lg">
                    Continue to CardCapture
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  Verification Failed
                </h1>
                <p className="text-gray-600 mb-6">
                  {message || 'We couldn\'t verify your email address.'}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Possible reasons:
                  </h3>
                  <ul className="text-sm text-gray-600 text-left space-y-1">
                    <li>• The verification link has expired</li>
                    <li>• The link has already been used</li>
                    <li>• The link is malformed</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Link to="/register">
                    <Button className="w-full">
                      Start Registration Again
                    </Button>
                  </Link>
                  
                  <Link to="/">
                    <Button variant="outline" className="w-full">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}