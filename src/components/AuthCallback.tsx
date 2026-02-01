import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Parse the hash fragment  
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const type = params.get('type');
    
    logger.log('🔗 AuthCallback received:', { hash, type });
    
    // Redirect based on the type
    if (type === 'recovery') {
      // Password reset flow
      logger.log('🔑 Redirecting to password reset page');
      navigate('/reset-password' + window.location.hash);
    } else if (type === 'invite') {
      // Invite flow  
      logger.log('📧 Redirecting to accept invite page');
      navigate('/accept-invite' + window.location.hash);
    } else {
      // Default fallback - if no type or unknown type
      logger.log('❓ Unknown auth type, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p>Redirecting...</p>
    </div>
  );
};

export default AuthCallback; 