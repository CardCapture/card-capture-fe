import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Database } from 'lucide-react';
import ccLogoOnly from '../../assets/cc-logo-only.svg';
import ccLogoPoster from '../../assets/cc-logo-only-transparent.png';

const Solution = () => {
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

    const section = document.getElementById('solution');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="solution" className="relative py-20 md:py-24 overflow-hidden bg-white">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className={`${visible ? 'animate-fade-in' : 'opacity-0'}`}>

          {/* Headline */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Every student <span className="text-primary">Every time</span>
            </h2>
          </div>

          {/* Demo Video */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative aspect-[16/10] rounded-3xl border-2 border-foreground/10 shadow-2xl overflow-hidden bg-white">
              {/* Logo overlay - shows before video loads */}
              <div className="absolute inset-0 flex items-center justify-center bg-white z-0">
                <img src={ccLogoOnly} alt="CardCapture Logo" className="w-48 h-48" />
              </div>
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={ccLogoPoster}
                className="w-full h-full object-cover relative z-10"
              >
                <source
                  src="https://assets.cardcapture.io/storage/v1/object/public/assets/Home%20Page%20Demo.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* 3 Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-primary" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold mb-2">No phones required</h3>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Clock className="h-7 w-7 text-emerald-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold mb-2">Email leads in hours</h3>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Database className="h-7 w-7 text-blue-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold mb-2">Direct Slate export</h3>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default Solution;
