// src/pages/HomePage.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import RecruiterLanding from '@/components/landing/RecruiterLanding';
import CoordinatorLanding from '@/components/landing/CoordinatorLanding';
import StudentLanding from '@/components/landing/StudentLanding';

type PersonaTab = 'recruiters' | 'coordinators' | 'students';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine persona from route path or query param
  const getPersonaFromPath = (): PersonaTab => {
    if (location.pathname === '/for-coordinators') return 'coordinators';
    if (location.pathname === '/for-students') return 'students';
    return (searchParams.get('persona') as PersonaTab) || 'recruiters';
  };

  const activeTab = getPersonaFromPath();

  useEffect(() => {
    // On mobile app, skip landing page and go straight to login
    if (Capacitor.isNativePlatform()) {
      navigate('/login', { replace: true });
      return;
    }
  }, [navigate]);

  const renderLandingPage = () => {
    switch (activeTab) {
      case 'coordinators':
        return <CoordinatorLanding />;
      case 'students':
        return <StudentLanding />;
      case 'recruiters':
      default:
        return <RecruiterLanding />;
    }
  };

  return renderLandingPage();
};

export default HomePage;
