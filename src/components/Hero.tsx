import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center py-20 overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute top-32 right-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-[15%] w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
      
      <div className="w-full mx-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className={`space-y-8 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Process Inquiry Cards in 15 Seconds
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Turn Inquiry Cards Into CRM Leads <span className="text-primary">Instantly</span>
            </h1>

            <p className="text-xl md:text-2xl font-medium text-foreground/90 leading-relaxed tracking-tight max-w-3xl mx-auto">
              Process inquiry cards in <span className="font-bold text-primary">15 seconds</span> Follow up in <span className="font-bold text-primary">24 hours</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => navigate('/get-started')}
              >
                Schedule a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 text-base text-foreground/70 justify-center sm:justify-start">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <span>12x faster lead processing</span>
              </div>

              <div className="flex items-center gap-3 text-base text-foreground/70 justify-center">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <span>24-hour follow-up capability</span>
              </div>

              <div className="flex items-center gap-3 text-base text-foreground/70 justify-center sm:justify-end">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <span>Direct CRM integration</span>
              </div>
            </div>
          </div>

          {/* How it works preview - positioned to entice scrolling */}
          <div className={`mt-24 ${visible ? 'animate-fade-in' : 'opacity-0'} animation-delay-800`}>
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                How It Works
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;