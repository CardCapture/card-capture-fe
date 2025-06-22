import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usersApi } from '@/api/backend/users';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type MagicLinkState = 'loading' | 'success' | 'error';

const MagicLinkPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<MagicLinkState>('loading');
  const [message, setMessage] = useState<string>('Processing your link...');

  useEffect(() => {
    // Prevent multiple executions
    let hasRun = false;
    
    const processMagicLink = async () => {
      if (hasRun) return;
      hasRun = true;
      
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        console.log('🪄 MagicLinkPage received:', { token: token?.substring(0, 8) + '...', type });

        if (!token || !type) {
          console.error('❌ Missing token or type in magic link');
          setState('error');
          setMessage('Invalid magic link - missing required parameters');
          return;
        }

        // Skip validation and go directly to consumption
        // This handles email client pre-scanning gracefully
        console.log('🔄 Processing magic link...');
        const result = await usersApi.consumeMagicLink(token, type);
        console.log('✅ Magic link processed:', result);

        // Set the session from the magic link result
        if (result.session) {
          console.log('🔑 Setting session from magic link');
          // The session is typically handled automatically by Supabase when we get the auth response
          // For magic links, we may need to manually set the session
          if (result.session.access_token && result.session.refresh_token) {
            await supabase.auth.setSession({
              access_token: result.session.access_token,
              refresh_token: result.session.refresh_token
            });
          }
        }

        setState('success');
        
        if (result.type === 'password_reset') {
          setMessage('Password reset link verified! Redirecting to reset password page...');
          setTimeout(() => {
            navigate('/reset-password', { 
              state: { 
                email: result.email,
                fromMagicLink: true 
              }
            });
          }, 2000);
        } else if (result.type === 'invite') {
          setMessage('Invitation verified! Redirecting to complete your account setup...');
          setTimeout(() => {
            navigate('/accept-invite', { 
              state: { 
                email: result.email,
                metadata: result.metadata,
                fromMagicLink: true 
              }
            });
          }, 2000);
        } else {
          setMessage('Link processed successfully!');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }

      } catch (error) {
        console.error('❌ Error processing magic link:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('400')) {
            // Handle already used magic links gracefully
            console.log('🔄 Magic link already processed (likely by email client scanning)');
            setState('success');
            setMessage('Processing your request...');
            
                         // Still redirect to appropriate page based on type
             const linkType = searchParams.get('type');
             if (linkType === 'password_reset') {
               setTimeout(() => {
                 navigate('/reset-password', { 
                   state: { 
                     email: 'Please enter your email',
                     fromMagicLink: true 
                   }
                 });
               }, 2000);
             } else if (linkType === 'invite') {
               setTimeout(() => {
                 navigate('/accept-invite', { 
                   state: { 
                     fromMagicLink: true 
                   }
                 });
               }, 2000);
             } else {
               setTimeout(() => {
                 navigate('/dashboard');
               }, 2000);
             }
            return;
          } else if (error.message.includes('404')) {
            setState('error');
            setMessage('This link was not found. It may have already been used.');
          } else {
            setState('error');
            setMessage('Failed to process your link. Please try again or contact support.');
          }
        } else {
          setState('error');
          setMessage('An unexpected error occurred. Please try again.');
        }

        // Show error toast only for actual errors
        if (state === 'error') {
          toast({
            title: "Link Processing Failed",
            description: message,
            variant: "destructive",
          });
        }
      }
    };

    processMagicLink();
  }, [searchParams, navigate]);

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">{message}</p>
          </div>
        );
      
      case 'success':
        return (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <p className="text-gray-700 text-center">{message}</p>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-8 w-8 text-red-600" />
            <p className="text-gray-700 text-center">{message}</p>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {state === 'loading' && 'Processing Link'}
            {state === 'success' && 'Success!'}
            {state === 'error' && 'Link Error'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default MagicLinkPage; 