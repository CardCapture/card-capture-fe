import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Dashboard from '@/components/EventDetails';
import ScanFab from '@/components/ScanFab';

const DashboardPage = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Dashboard />
      </main>
      <ScanFab />
    </div>
  );
};

export default DashboardPage;