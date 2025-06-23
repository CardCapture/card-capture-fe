import React, { useEffect, useState, useRef } from 'react';
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
  const hasProcessed = useRef(false);

  useEffect(() => {
    const processMagicLink = async () => {
      if (hasProcessed.current) {
        console.log('🚫 Magic link already processed, skipping');
        return;
      }
      hasProcessed.current = true;
      
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

        // For invite magic links, no session handling needed
        console.log('✅ Magic link processed successfully');

        setState('success');
        
        if (result.type === 'password_reset') {
          // If the backend provided session tokens, set them up
          if (result.session && result.session.access_token) {
            console.log('🔑 Setting up session from magic link...');
            try {
              await supabase.auth.setSession({
                access_token: result.session.access_token,
                refresh_token: result.session.refresh_token || ''
              });
              console.log('✅ Session established for password reset');
              
              setMessage('Password reset link verified and authenticated! Redirecting...');
              setTimeout(() => {
                navigate('/reset-password', { 
                  state: { 
                    email: result.email,
                    fromMagicLink: true,
                    hasSession: true
                  }
                });
              }, 2000);
            } catch (sessionError) {
              console.error('❌ Error setting session:', sessionError);
              // Fallback to normal flow without session
              setMessage('Password reset link verified! Redirecting to reset password page...');
              setTimeout(() => {
                navigate('/reset-password', { 
                  state: { 
                    email: result.email,
                    fromMagicLink: true,
                    requiresSignin: result.requires_signin || false
                  }
                });
              }, 2000);
            }
          } else {
            // No session provided - normal flow
            setMessage('Password reset link verified! Redirecting to reset password page...');
            setTimeout(() => {
              navigate('/reset-password', { 
                state: { 
                  email: result.email,
                  fromMagicLink: true,
                  requiresSignin: result.requires_signin || false
                }
              });
            }, 2000);
          }
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
               // For already processed invites, try to get user info from current session
               const getUserInfo = async () => {
                 try {
                   const { data: { user } } = await supabase.auth.getUser();
                   if (user) {
                     navigate('/accept-invite', { 
                       state: { 
                         email: user.email,
                         fromMagicLink: true,
                         userAlreadyExists: true,
                         hasSession: true
                       }
                     });
                   } else {
                     navigate('/accept-invite', { 
                       state: { 
                         fromMagicLink: true,
                         needsManualEmail: true,
                         hasSession: false
                       }
                     });
                   }
                 } catch {
                   navigate('/accept-invite', { 
                     state: { 
                       fromMagicLink: true,
                       needsManualEmail: true,
                       hasSession: false
                     }
                   });
                 }
               };
               
               setTimeout(getUserInfo, 2000);
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
  }, []);

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