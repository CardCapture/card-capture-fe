// src/pages/HomePage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Hero from '@/components/Hero';
import Problem from '@/components/Problem';
import Solution from '@/components/Solution';
import HowItWorks from '@/components/HowItWorks';
import Differentiator from '@/components/Differentiator';
import SecondaryFeatures from '@/components/SecondaryFeatures';
import FinalCTA from '@/components/Features';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // On mobile app, skip landing page and go straight to login
    if (Capacitor.isNativePlatform()) {
      navigate('/login', { replace: true });
      return;
    }
    // Scroll to top when component mounts (web only)
    window.scrollTo(0, 0);
  }, [navigate]);

  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <Differentiator />
      <SecondaryFeatures />
      <FinalCTA />
    </>
  );
};

export default HomePage;