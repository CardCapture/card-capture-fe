// src/pages/HomePage.tsx
import { useEffect } from 'react';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';

const HomePage = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
    </>
  );
};

export default HomePage;