// src/components/Navbar.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Button } from '@/components/ui/button'; // Import Button
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Logo from './Logo';

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, loading } = useAuth(); // Get auth state and functions
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true }); // Redirect home after logout
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/70 dark:bg-black/70 backdrop-blur-lg shadow-md py-3' : 'bg-transparent py-5'
    }`}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Left Side: Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <Logo type="icon" className="h-10 w-10" />
          <Logo type="text" className="h-6" />
        </Link>

        {/* Right Side: Group Nav and Auth Status */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Navigation Links */}
          <nav className="flex items-center space-x-1">
            {/* "Home" Link Removed */}
            {/* Dashboard link removed since it's redundant */}
          </nav>

          {/* Auth Status Section */}
          <div className="flex items-center">
            {loading ? (
              <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div> // Loading placeholder
            ) : user ? (
              // Logged In View with Dropdown
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300 hidden lg:inline">{user.email}</span>
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Logged Out View
              <Link to="/login">
                <Button variant="default" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <div className="md:hidden">
          {/* TODO: Implement mobile menu logic if needed */}
          <button className="p-2 rounded-full hover:bg-secondary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;