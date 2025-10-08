import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section className="relative min-h-[95vh] flex items-center py-16 md:py-20 overflow-hidden bg-white">
      {/* Subtle background gradient */}
      <div className="absolute top-32 right-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-[15%] w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />

      <div className="w-full mx-auto relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className={`space-y-12 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>

            {/* Headline */}
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                College fairs that work
                <br />
                <span className="text-primary">With or Without Phones</span>
              </h1>

              <p className="text-xl md:text-2xl text-foreground/70 font-medium max-w-2xl mx-auto">
                <span className="font-bold">Universal Cards or QR Codes</span> <span className="text-primary">Instant Data for Every Student</span> 
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/get-started')}
                >
                  Schedule a Demo
                </Button>
              </div>

              <p className="text-sm text-foreground/50">
                2-minute setup · Works at any fair
              </p>
            </div>

            {/* Video */}
            <div className="relative max-w-5xl mx-auto">
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-foreground/10 bg-white">
                <div className="aspect-video relative">
                  <video
                    controls
                    className="w-full h-full"
                    poster="https://assets.cardcapture.io/storage/v1/object/public/assets/cc-logo-transparent-min.png"
                    preload="metadata"
                  >
                    <source
                      src="https://assets.cardcapture.io/storage/v1/object/public/assets/CardCapture%20Demo.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
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