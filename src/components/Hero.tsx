import { useState, useEffect } from 'react';
import { Camera, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-32 right-[20%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-[15%] w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
      
      <div className="w-full mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto px-4">
          <div className={`space-y-6 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              AI-Powered Prospect Card Capture
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Transform Handwritten Cards Into Digital Data <span className="text-primary">Instantly</span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/80 max-w-xl">
              Our AI reviewer does the heavy lifting, reducing manual data entry by 95%. Just review and export - it's that simple.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg"
                onClick={() => navigate('/get-started')}
              >
                Request Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg"
                onClick={() => navigate('/pricing')}
              >
                View Pricing
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>AI-powered review</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>95% less manual entry</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Instant export</span>
              </div>
            </div>
          </div>

          <div className={`relative ${visible ? 'animate-fade-in opacity-100' : 'opacity-0'} animation-delay-300`}>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden glass-panel shadow-lg">
              <div className="relative h-full">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80" 
                  alt="College recruitment" 
                  className="object-cover w-full h-full rounded-2xl opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-2xl"></div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-xl font-medium">Streamline your recruitment process</p>
                  <p className="text-sm opacity-90 mt-1">Focus more on connecting with students, less on paperwork</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;