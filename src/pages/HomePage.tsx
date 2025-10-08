// src/pages/HomePage.tsx
import { useEffect } from 'react';
import Hero from '@/components/Hero';
import Problem from '@/components/Problem';
import Solution from '@/components/Solution';
import HowItWorks from '@/components/HowItWorks';
import Differentiator from '@/components/Differentiator';
import SecondaryFeatures from '@/components/SecondaryFeatures';
import FinalCTA from '@/components/Features';

const HomePage = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

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