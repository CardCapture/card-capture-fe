// src/pages/HomePage.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import RecruiterLanding from '@/components/landing/RecruiterLanding';
import CoordinatorLanding from '@/components/landing/CoordinatorLanding';
import StudentLanding from '@/components/landing/StudentLanding';

type PersonaTab = 'recruiters' | 'coordinators' | 'students';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const activeTab = (searchParams.get('persona') as PersonaTab) || 'recruiters';

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
