import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRedirectPath } from '@/utils/roleRedirect';
import { Menu, X } from 'lucide-react';
import ccLogoOnly from '../../assets/cc-logo-only.svg';

interface LandingLayoutProps {
  children: React.ReactNode;
}

const LandingLayout = ({ children }: LandingLayoutProps) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboardClick = () => {
    const redirectPath = getDefaultRedirectPath(profile);
    navigate(redirectPath);
  };

  const NavLink = ({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) => (
    <Link 
      to={to} 
      className={`relative px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
        location.pathname === to 
          ? 'text-primary font-semibold' 
          : 'text-foreground/60'
      } ${className}`}
      onClick={() => setMobileMenuOpen(false)}
    >
      {location.pathname === to && (
        <span className="absolute inset-0 bg-primary/10 rounded-full -z-10" />
      )}
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gradient-to-br from-blue-50/80 via-white/80 to-purple-50/80 backdrop-blur-lg shadow-md py-3' : 'bg-gradient-to-br from-blue-50/40 via-white/40 to-purple-50/40 backdrop-blur-sm py-5'
      }`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src={ccLogoOnly} alt="Card Capture Logo" className="h-10 w-10" />
              <span className="font-bold text-xl tracking-tight">CardCapture</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center flex-1 justify-center">
              <nav className="flex items-center space-x-6">
                {/* No links needed since Home is the only page */}
              </nav>
            </div>
            
            {/* Right side navigation */}
            <div className="hidden md:flex items-center">
              <Link 
                to="/get-started"
                className="px-3 py-1.5 text-sm font-semibold text-primary border border-primary/30 rounded-full transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                Schedule a Demo
              </Link>
              
              {user ? (
                <Button 
                  variant="default" 
                  size="sm"
                  className="ml-3"
                  onClick={handleDashboardClick}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Link to="/login" className="ml-3">
                  <Button variant="default" size="sm">
                    Login
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 space-y-2">
              {/* No links needed since Home is the only page */}
              <Link 
                to="/get-started"
                className="block px-3 py-1.5 text-sm font-semibold text-primary border border-primary/30 rounded-full transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                Schedule a Demo
              </Link>
              {user ? (
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    handleDashboardClick();
                    setMobileMenuOpen(false);
                  }}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <NavLink to="/login">Login</NavLink>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary/30 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={ccLogoOnly} alt="Card Capture Logo" className="h-8 w-8" />
                <span className="font-bold text-lg tracking-tight">CardCapture</span>
              </div>
              <p className="text-sm text-foreground/70">
              The only college fair registration system that works <b>with or without phones</b>
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="text-foreground/70 hover:text-foreground">Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-foreground/70 hover:text-foreground">About</Link></li>
                <li><Link to="/contact" className="text-foreground/70 hover:text-foreground">Contact</Link></li>
                <li><Link to="/privacy" className="text-foreground/70 hover:text-foreground">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-foreground/10 text-center text-sm text-foreground/70">
            <p>&copy; {new Date().getFullYear()} CardCapture. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingLayout; 