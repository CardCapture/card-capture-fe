import { useState, useEffect } from 'react';
import { Smartphone, X, Check } from 'lucide-react';

const Problem = () => {
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

    const section = document.getElementById('problem');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="problem" className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-b from-white to-secondary/20">
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className={`text-center ${visible ? 'animate-fade-in' : 'opacity-0'}`}>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Digital Convenience <span className="text-primary">Physical Reliability</span>
          </h2>
          {/* Visual comparison */}
          <div className="max-w-3xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* QR-Only Platforms - Limited */}
            <div className="relative p-8 rounded-2xl bg-yellow-50/50 border-2 border-yellow-200/50">
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <X className="h-6 w-6 text-white" strokeWidth={3} />
              </div>
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">QR-Only Platforms</h3>
              <p className="text-sm text-foreground/70">
                Fast and digital, but limited by phone bans and uneven access.
              </p>
            </div>

            {/* CardCapture - Works */}
            <div className="relative p-8 rounded-2xl bg-green-50/50 border-2 border-green-200/50">
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-white" strokeWidth={3} />
              </div>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2"/>
                  <path d="M7 10h6M7 14h10" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">CardCapture</h3>
              <p className="text-sm text-foreground/70">
                Works with QR codes and physical cards. One system that includes every student.
              </p>
            </div>

          </div>

          {/* Supporting copy */}
        </div>
      </div>
    </section>
  );
};

export default Problem;
