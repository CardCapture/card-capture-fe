import { useState, useEffect } from 'react';
import { Package, Camera, Download, Smartphone, FileText } from 'lucide-react';

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

  const workflowSteps = [
    {
      step: "1",
      title: "QR Codes or Paper Cards",
      description: "Both Accepted",
      visual: (
        <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-blue-100/50 rounded-2xl flex items-center justify-center border border-foreground/10 relative">
          <div className="flex gap-6">
            <Smartphone className="h-16 w-16 text-primary/60" strokeWidth={1.5} />
            <FileText className="h-16 w-16 text-primary/60" strokeWidth={1.5} />
          </div>
        </div>
      )
    },
    {
      step: "2",
      title: "Every student included",
      description: "Digital or paper—they choose",
      visual: (
        <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-green-100/50 rounded-2xl flex items-center justify-center border border-foreground/10">
          <Camera className="h-20 w-20 text-emerald-500/40" strokeWidth={1.5} />
        </div>
      )
    },
    {
      step: "3",
      title: "Unified export",
      description: "All data, one export",
      visual: (
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100/50 rounded-2xl flex items-center justify-center border border-foreground/10">
          <Download className="h-20 w-20 text-blue-500/40" strokeWidth={1.5} />
        </div>
      )
    }
  ];

  return (
    <section id="how-it-works" className="relative py-20 md:py-24 overflow-hidden bg-secondary/20">
      <div className="max-w-6xl mx-auto px-4 relative z-10">

        {/* Headline */}
        <div className={`text-center mb-16 ${visible ? 'animate-fade-in' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold">
            Two methods <span className="text-primary">One Platform</span>
          </h2>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {workflowSteps.map((step, index) => (
            <div
              key={index}
              className={`relative ${
                visible ? 'animate-fade-in opacity-100' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 150 + 200}ms` }}
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg z-10">
                {step.step}
              </div>

              {/* Visual placeholder */}
              <div className="relative mb-6">
                {step.visual}
              </div>

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-bold text-center mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-base text-foreground/60 text-center">
                {step.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;