import { useState, useEffect } from 'react';
import { Camera, Brain, CheckCircle, Database } from 'lucide-react';

const HowItWorks = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('how-it-works');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
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
    <section id="how-it-works" className="relative pt-2 pb-12 overflow-hidden bg-white">
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        
        {/* 2x2 Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {workflowSteps.map((step, index) => (
            <div 
              key={index} 
              className={`relative group ${
                visible ? 'animate-fade-in opacity-100' : 'opacity-0'
              } hover:scale-105 transition-all duration-300`}
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              {/* Step card */}
              <div className="bg-white/70 dark:bg-black/70 backdrop-blur-lg border border-white/20 dark:border-black/20 rounded-xl shadow-lg p-6 h-full flex flex-col items-center text-center hover:shadow-xl transition-all duration-300">
                
                {/* Icon container */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 md:w-18 md:h-18 rounded-xl bg-gradient-to-br from-white via-white to-blue-50/50 shadow-md shadow-primary/10 flex items-center justify-center border border-white/50 backdrop-blur-sm group-hover:shadow-lg group-hover:shadow-primary/15 transition-all duration-300">
                    {step.icon}
                  </div>
                  
                  {/* Step number badge */}
                  <div className="absolute -top-2 -left-2 w-7 h-7 bg-gradient-to-br from-primary to-primary/90 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md shadow-primary/25">
                    {step.step}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg md:text-xl mb-2 text-foreground leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-foreground/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;