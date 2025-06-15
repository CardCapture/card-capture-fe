import { useState, useEffect } from 'react';
import { Camera, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel } from '@/components/ui/carousel';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setVisible(true);
  }, []);

  // Carousel images
  const carouselImages = [
    {
      src: 'https://assets.cardcapture.io/storage/v1/object/public/assets/create_event.jpg',
      alt: 'Create Event - Set up new recruitment events',
      caption: 'Set up events in seconds' 
    },
    {
      src: 'https://assets.cardcapture.io/storage/v1/object/public/assets//field_preferences%20.jpg',
      alt: 'Field Preferences - Customize data fields',
      caption: 'Manage and confirgure your field preferences'
    },
    {
      src: 'https://assets.cardcapture.io/storage/v1/object/public/assets/manage_majors.jpg',
      alt: 'Manage Majors - Configure academic programs',
      caption: 'Automatically map card inputs to your school\'s majors'
    },
    {
      src: 'https://assets.cardcapture.io/storage/v1/object/public/assets/needs_review.jpg',
      alt: 'Needs Review - Cards requiring attention',
      caption: 'AI flags only what needs your attention'
    },
    {
      src: 'https://assets.cardcapture.io/storage/v1/object/public/assets/needs_review_modal.jpg',
      alt: 'Review Modal - Detailed card review interface',
      caption: 'Review and approve in one click'
    },
    {
      src: 'https://assets.cardcapture.io/storage/v1/object/public/assets/ready_for_export.jpg',
      alt: 'Ready for Export - Processed cards ready for download',
      caption: 'Export clean data to CSV or send to Slate'
    }
  ];

  return (
    <section className="relative min-h-[80vh] flex items-center py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-32 right-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
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
              <Carousel 
                images={carouselImages}
                autoPlay={true}
                autoPlayInterval={4000}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;