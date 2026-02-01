import { useEffect, useState, useRef } from 'react';
import { logger } from '@/utils/logger';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { recruiterSignupService } from '@/services/RecruiterSignupService';

type PaymentStatus = 'loading' | 'completed' | 'pending' | 'failed' | 'error';

export default function SignupSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [eventId, setEventId] = useState<string | null>(null);
  const [message, setMessage] = useState('Verifying your payment...');
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_POLLS = 10;
  const POLL_INTERVAL = 2000;

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('Invalid payment session. Please try again.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const result = await recruiterSignupService.verifyPayment(sessionId);

        if (result.status === 'completed') {
          setStatus('completed');
          setEventId(result.event_id);
          setMessage(result.message);

          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }

          // Auto-redirect after 2 seconds
          if (result.event_id) {
            setTimeout(() => {
              navigate(`/events/${result.event_id}`);
            }, 2000);
          }
        } else if (result.status === 'failed') {
          setStatus('failed');
          setMessage(result.message);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        } else {
          setStatus('pending');
          setMessage(result.message);
        }
      } catch (err) {
        logger.error('Payment verification error:', err);
        setStatus('error');
        setMessage('Unable to verify payment. Please contact support.');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }
    };

    // Initial check
    verifyPayment();

    // Poll for status if not immediately completed
    pollIntervalRef.current = setInterval(() => {
      setPollCount(prev => {
        if (prev >= MAX_POLLS) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setStatus('pending');
          setMessage('Payment is taking longer than expected. You will receive an email confirmation shortly.');
          return prev;
        }
        verifyPayment();
        return prev + 1;
      });
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [sessionId, navigate]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'loading':
      case 'pending':
        return {
          icon: <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />,
          bgColor: 'bg-blue-100',
          title: 'Processing Payment...'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          bgColor: 'bg-green-100',
          title: 'Payment Successful!'
        };
      case 'failed':
      case 'error':
        return {
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          bgColor: 'bg-red-100',
          title: status === 'failed' ? 'Payment Failed' : 'Something Went Wrong'
        };
    }
  };

  const displayInfo = getStatusDisplay();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-6">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${displayInfo.bgColor}`}>
              {displayInfo.icon}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {displayInfo.title}
            </h1>

            <p className="text-gray-600 mb-6">
              {message}
            </p>

            {status === 'completed' && eventId && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Your event is ready! Redirecting you now...
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate(`/events/${eventId}`)}
                >
                  Go to Your Event
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {status === 'pending' && pollCount >= MAX_POLLS && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">
                    Check your email for confirmation. Your event will be ready when you log in.
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {(status === 'failed' || status === 'error') && (
              <div className="space-y-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/signup/select-event')}
                >
                  Try Again
                </Button>

                <p className="text-xs text-gray-500">
                  If you continue to have issues, please contact support.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
