import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout; 