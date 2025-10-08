import { useState, useEffect } from 'react';
import { Brain, FileCheck, Database } from 'lucide-react';

const SecondaryFeatures = () => {
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

    const section = document.getElementById('secondary-features');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "AI transcribes handwriting"
    },
    {
      icon: <FileCheck className="h-8 w-8 text-emerald-600" />,
      title: "Review Only What it Flags"
    },
    {
      icon: <Database className="h-8 w-8 text-blue-600" />,
      title: "Export to any CRM"
    }
  ];

  return (
    <section id="secondary-features" className="relative py-20 md:py-24 overflow-hidden bg-secondary/20">
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className={`${visible ? 'animate-fade-in' : 'opacity-0'}`}>

          {/* Headline */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Admissions Ready <span className="text-primary">CRM Friendly</span>
            </h2>
          </div>

          {/* 3-column grid - icon + title only */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl shadow-md flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default SecondaryFeatures;
