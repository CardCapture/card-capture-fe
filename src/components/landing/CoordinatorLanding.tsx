import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users,
  CheckCircle,
  BarChart3,
  CalendarPlus,
  Megaphone,
  FileText
} from 'lucide-react';

const CoordinatorLanding = () => {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const [benefitsVisible, setBenefitsVisible] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);

  useEffect(() => {
    setHeroVisible(true);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const createObserver = (id: string, setter: (v: boolean) => void) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setter(true);
          });
        },
        { threshold: 0.1 }
      );
      const section = document.getElementById(id);
      if (section) observer.observe(section);
      return observer;
    };

    const observers = [
      createObserver('coordinator-benefits', setBenefitsVisible),
      createObserver('coordinator-how-it-works', setHowItWorksVisible),
    ];

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center py-16 md:py-20 overflow-hidden bg-white">
        <div className="absolute top-32 right-[10%] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-[10%] w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />

        <div className="w-full mx-auto relative z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className={`space-y-12 ${heroVisible ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="text-center space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                  The Easiest Way to Run
                  <br />
                  <span className="text-primary">a College Fair</span>
                </h1>

                <p className="text-xl md:text-2xl text-foreground/70 font-medium max-w-3xl mx-auto">
                  Student QR codes or handwritten inquiry cards
                  <br />
                  <span className="text-primary">One app for both</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6"
                    onClick={() => navigate('/create-event')}
                  >
                    Register Your Event
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6"
                    onClick={() => {
                      const benefitsSection = document.getElementById('coordinator-benefits');
                      benefitsSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Learn More
                  </Button>
                </div>
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

      {/* Benefits Section */}
      <section id="coordinator-benefits" className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-b from-white to-secondary/20">
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className={`text-center ${benefitsVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Schools Love <span className="text-primary">Fairs on CardCapture</span>
            </h2>

            <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-blue-50/50 border border-blue-200/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Universal Support</h3>
                <p className="text-foreground/70">
                  Works for schools with any tech preference—digital or traditional
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">No Pre-Work Required</h3>
                <p className="text-foreground/70">
                  Just hand out inquiry cards at the event—no complex setup
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-purple-50/50 border border-purple-200/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">More Data for Schools</h3>
                <p className="text-foreground/70">
                  Every student can participate, so schools capture more leads
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="coordinator-how-it-works" className="relative py-20 md:py-24 overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className={`text-center mb-16 ${howItWorksVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold">
              Set Up Your Fair <span className="text-primary">in Minutes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Register Your Event",
                description: "Add your fair to our event catalog",
                icon: <CalendarPlus className="h-16 w-16 text-primary/60" strokeWidth={1.5} />,
                bgClass: "from-primary/10 to-blue-100/50"
              },
              {
                step: "2",
                title: "Students Register Online",
                description: "They get a QR code, you get better data",
                icon: <Megaphone className="h-16 w-16 text-emerald-500/60" strokeWidth={1.5} />,
                bgClass: "from-emerald-50 to-green-100/50"
              },
              {
                step: "3",
                title: "Hand Out Cards Day-Of",
                description: "Inquiry cards for students without devices",
                icon: <FileText className="h-16 w-16 text-purple-500/60" strokeWidth={1.5} />,
                bgClass: "from-purple-50 to-indigo-100/50"
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`relative ${howItWorksVisible ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 150 + 200}ms` }}
              >
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg z-10">
                  {item.step}
                </div>
                <div className={`aspect-[4/3] bg-gradient-to-br ${item.bgClass} rounded-2xl flex items-center justify-center border border-foreground/10 mb-6`}>
                  {item.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-center mb-2">{item.title}</h3>
                <p className="text-base text-foreground/60 text-center">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Modernize <span className="opacity-80">Your Fair?</span>
          </h2>
          <p className="text-xl md:text-2xl opacity-90 mb-10">
            Give recruiters and students the tools they need for a successful event
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-6"
              onClick={() => navigate('/create-event')}
            >
              Register Your Event
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Questions? <a href="/contact" className="underline hover:opacity-100">Contact us</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default CoordinatorLanding;
