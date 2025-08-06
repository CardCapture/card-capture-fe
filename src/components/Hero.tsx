import { useState, useEffect } from 'react';
import { Camera, ArrowRight, CheckCircle, Brain, Database, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setVisible(true);
  }, []);

  // Workflow steps
  const workflowSteps = [
    {
      icon: <Camera className="h-9 w-9 text-primary/80" strokeWidth={1.5} />,
      step: "1",
      title: "Capture",
      description: "Take a photo of handwritten inquiry cards"
    },
    {
      icon: <Brain className="h-9 w-9 text-emerald-500/80" strokeWidth={1.5} />,
      step: "2", 
      title: "AI Extraction",
      description: "Our AI extracts and validates all data in seconds"
    },
    {
      icon: <CheckCircle className="h-9 w-9 text-blue-500/80" strokeWidth={1.5} />,
      step: "3",
      title: "Review",
      description: "Quick review of flagged items"
    },
    {
      icon: <Database className="h-9 w-9 text-indigo-500/80" strokeWidth={1.5} />,
      step: "4",
      title: "Export to Slate",
      description: "Export clean data instantly to Slate or CSV"
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
              Process Inquiry Cards in 15 Seconds
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Turn Inquiry Cards Into CRM Leads <span className="text-primary">Instantly</span>
            </h1>

            <p className="text-xl md:text-2xl font-medium text-foreground/90 leading-relaxed tracking-tight max-w-2xl">
              Process inquiry cards in <span className="font-bold text-primary">15 seconds</span> Follow up in <span className="font-bold text-primary">24 hours</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg"
                onClick={() => navigate('/get-started')}
              >
                Schedule a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>12x faster lead processing</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>24-hour follow-up capability</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Direct CRM integration</span>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className={`relative mt-20 ${visible ? 'animate-fade-in opacity-100' : 'opacity-0'} animation-delay-300`}>
            {/* Subtle background section with soft edges */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-slate-50/30 to-blue-50/20 rounded-[2rem] -mx-8 -my-6 backdrop-blur-[1px]"></div>
            
            {/* Premium SaaS design flourishes */}
            <div className="absolute -top-12 -right-24 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/20 rounded-full blur-2xl"></div>
            <div className="absolute top-16 -left-16 w-24 h-24 bg-gradient-to-br from-primary/10 to-blue-200/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-8 right-1/3 w-20 h-20 bg-gradient-to-br from-emerald-100/20 to-cyan-100/10 rounded-full blur-lg"></div>
            
            <div className="relative z-10 py-8 px-6">
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">How it works</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
              {workflowSteps.map((step, index) => (
                <div key={index} className={`text-center relative group ${index % 2 === 1 ? 'lg:mt-6' : ''}`}>
                  {/* Subtle connecting line */}
                  {index < workflowSteps.length - 1 && (
                    <div className={`hidden lg:block absolute ${index % 2 === 0 ? 'top-10' : 'top-16'} left-full w-12 h-px bg-gradient-to-r from-primary/25 via-primary/15 to-transparent transform translate-x-2 -translate-y-1/2`}></div>
                  )}
                  
                  {/* Floating background flourish */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-blue-50/30 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-110"></div>
                  
                  {/* Step content */}
                  <div className="relative z-10 transform group-hover:-translate-y-1 transition-all duration-300">
                    <div className="relative mb-6">
                      {/* Icon container with premium styling */}
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white via-white to-blue-50/50 shadow-lg shadow-primary/5 flex items-center justify-center mx-auto border border-white/50 backdrop-blur-sm group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-300">
                        {step.icon}
                      </div>
                      
                      {/* Step number badge */}
                      <div className="absolute -top-3 -right-6 w-8 h-8 bg-gradient-to-br from-primary to-primary/90 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/25">
                        {step.step}
                      </div>
                      
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    
                    <h3 className="font-bold text-xl mb-3 text-foreground group-hover:text-primary transition-colors duration-300">{step.title}</h3>
                    <p className="text-sm text-foreground/60 leading-relaxed max-w-xs mx-auto">{step.description}</p>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;