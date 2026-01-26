import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Smartphone,
  Shield,
  UserPlus,
  Share2,
  FileText,
  ChevronDown,
  ChevronUp,
  Mail
} from 'lucide-react';

const StudentLanding = () => {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const [benefitsVisible, setBenefitsVisible] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      createObserver('student-benefits', setBenefitsVisible),
      createObserver('student-how-it-works', setHowItWorksVisible),
      createObserver('student-faq', setFaqVisible),
    ];

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const faqs = [
    {
      question: "What if I don't have a QR code?",
      answer: "No problem! You can fill out a handwritten inquiry card at the fair. The school will photograph it and your information gets digitized automatically."
    },
    {
      question: "What info do I share?",
      answer: "You control what you share: typically your name, email, school, graduation year, and areas of interest. Colleges only see what you provide."
    },
    {
      question: "How do I get my QR code?",
      answer: "After you register, you'll receive your unique QR code via email and text. Be sure to have it availalbe to scan"
    },
    {
      question: "Can I update my information?",
      answer: "Yes! You can update your profile anytime. Your QR code stays the same, but schools will see your updated information when they scan it."
    },
    {
      question: "Is it free?",
      answer: "Absolutely free for students. No hidden fees, no subscriptions—just a simple way to connect with colleges."
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center py-16 md:py-20 overflow-hidden bg-white">
        <div className="absolute top-32 right-[10%] w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-[10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="w-full mx-auto relative z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className={`${heroVisible ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 text-center md:text-left">
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                    One Profile
                    <br />
                    <span className="text-primary">Every College Fair</span>
                  </h1>

                  <p className="text-xl md:text-2xl text-foreground/70 font-medium">
                    Complete your registration to receive your unique QR code.
                    <br />
                    <span className="text-primary">Share it with colleges at your next fair.</span>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                    <Button
                      size="lg"
                      className="text-lg px-8 py-6"
                      onClick={() => navigate('/register')}
                    >
                      Get Your QR Code
                    </Button>
                  </div>
                </div>

                {/* Phone mockup with QR code */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-64 h-[500px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-3 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-[2.5rem] flex flex-col items-center justify-center p-6">
                        <div className="w-8 h-8 bg-gray-200 rounded-full mb-6" />
                        {/* Real QR code pattern */}
                        <div className="w-40 h-40 mb-4">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* QR code pattern - simplified realistic representation */}
                            <rect fill="white" width="100" height="100"/>
                            {/* Position detection patterns (corners) */}
                            <rect fill="#2563eb" x="4" y="4" width="24" height="24"/>
                            <rect fill="white" x="8" y="8" width="16" height="16"/>
                            <rect fill="#2563eb" x="12" y="12" width="8" height="8"/>

                            <rect fill="#2563eb" x="72" y="4" width="24" height="24"/>
                            <rect fill="white" x="76" y="8" width="16" height="16"/>
                            <rect fill="#2563eb" x="80" y="12" width="8" height="8"/>

                            <rect fill="#2563eb" x="4" y="72" width="24" height="24"/>
                            <rect fill="white" x="8" y="76" width="16" height="16"/>
                            <rect fill="#2563eb" x="12" y="80" width="8" height="8"/>

                            {/* Data modules */}
                            <rect fill="#2563eb" x="32" y="4" width="4" height="4"/>
                            <rect fill="#2563eb" x="40" y="4" width="4" height="4"/>
                            <rect fill="#2563eb" x="48" y="4" width="4" height="4"/>
                            <rect fill="#2563eb" x="56" y="4" width="4" height="4"/>
                            <rect fill="#2563eb" x="64" y="4" width="4" height="4"/>

                            <rect fill="#2563eb" x="32" y="12" width="4" height="4"/>
                            <rect fill="#2563eb" x="44" y="12" width="4" height="4"/>
                            <rect fill="#2563eb" x="52" y="12" width="4" height="4"/>
                            <rect fill="#2563eb" x="64" y="12" width="4" height="4"/>

                            <rect fill="#2563eb" x="36" y="20" width="4" height="4"/>
                            <rect fill="#2563eb" x="48" y="20" width="4" height="4"/>
                            <rect fill="#2563eb" x="60" y="20" width="4" height="4"/>

                            <rect fill="#2563eb" x="4" y="32" width="4" height="4"/>
                            <rect fill="#2563eb" x="12" y="32" width="4" height="4"/>
                            <rect fill="#2563eb" x="24" y="32" width="4" height="4"/>
                            <rect fill="#2563eb" x="36" y="32" width="4" height="4"/>
                            <rect fill="#2563eb" x="44" y="32" width="4" height="4"/>
                            <rect fill="#2563eb" x="56" y="32" width="4" height="4"/>
                            <rect fill="#2563eb" x="68" y="32" width="4" height="4"/>
                            <rect fill="#2563eb" x="80" y="32" width="4" height="4"/>
                            <rect fill="#2563eb" x="92" y="32" width="4" height="4"/>

                            <rect fill="#2563eb" x="4" y="40" width="4" height="4"/>
                            <rect fill="#2563eb" x="16" y="40" width="4" height="4"/>
                            <rect fill="#2563eb" x="28" y="40" width="4" height="4"/>
                            <rect fill="#2563eb" x="40" y="40" width="4" height="4"/>
                            <rect fill="#2563eb" x="52" y="40" width="4" height="4"/>
                            <rect fill="#2563eb" x="64" y="40" width="4" height="4"/>
                            <rect fill="#2563eb" x="76" y="40" width="4" height="4"/>
                            <rect fill="#2563eb" x="88" y="40" width="4" height="4"/>

                            <rect fill="#2563eb" x="4" y="48" width="4" height="4"/>
                            <rect fill="#2563eb" x="12" y="48" width="4" height="4"/>
                            <rect fill="#2563eb" x="20" y="48" width="4" height="4"/>
                            <rect fill="#2563eb" x="32" y="48" width="4" height="4"/>
                            <rect fill="#2563eb" x="44" y="48" width="4" height="4"/>
                            <rect fill="#2563eb" x="56" y="48" width="4" height="4"/>
                            <rect fill="#2563eb" x="68" y="48" width="4" height="4"/>
                            <rect fill="#2563eb" x="80" y="48" width="4" height="4"/>
                            <rect fill="#2563eb" x="92" y="48" width="4" height="4"/>

                            <rect fill="#2563eb" x="4" y="56" width="4" height="4"/>
                            <rect fill="#2563eb" x="16" y="56" width="4" height="4"/>
                            <rect fill="#2563eb" x="24" y="56" width="4" height="4"/>
                            <rect fill="#2563eb" x="36" y="56" width="4" height="4"/>
                            <rect fill="#2563eb" x="48" y="56" width="4" height="4"/>
                            <rect fill="#2563eb" x="60" y="56" width="4" height="4"/>
                            <rect fill="#2563eb" x="72" y="56" width="4" height="4"/>
                            <rect fill="#2563eb" x="84" y="56" width="4" height="4"/>

                            <rect fill="#2563eb" x="4" y="64" width="4" height="4"/>
                            <rect fill="#2563eb" x="12" y="64" width="4" height="4"/>
                            <rect fill="#2563eb" x="20" y="64" width="4" height="4"/>
                            <rect fill="#2563eb" x="32" y="64" width="4" height="4"/>
                            <rect fill="#2563eb" x="44" y="64" width="4" height="4"/>
                            <rect fill="#2563eb" x="56" y="64" width="4" height="4"/>
                            <rect fill="#2563eb" x="68" y="64" width="4" height="4"/>
                            <rect fill="#2563eb" x="80" y="64" width="4" height="4"/>
                            <rect fill="#2563eb" x="92" y="64" width="4" height="4"/>

                            <rect fill="#2563eb" x="32" y="72" width="4" height="4"/>
                            <rect fill="#2563eb" x="40" y="72" width="4" height="4"/>
                            <rect fill="#2563eb" x="52" y="72" width="4" height="4"/>
                            <rect fill="#2563eb" x="64" y="72" width="4" height="4"/>
                            <rect fill="#2563eb" x="72" y="76" width="4" height="4"/>
                            <rect fill="#2563eb" x="84" y="76" width="4" height="4"/>

                            <rect fill="#2563eb" x="32" y="80" width="4" height="4"/>
                            <rect fill="#2563eb" x="44" y="80" width="4" height="4"/>
                            <rect fill="#2563eb" x="56" y="84" width="4" height="4"/>
                            <rect fill="#2563eb" x="68" y="84" width="4" height="4"/>
                            <rect fill="#2563eb" x="80" y="84" width="4" height="4"/>
                            <rect fill="#2563eb" x="92" y="84" width="4" height="4"/>

                            <rect fill="#2563eb" x="36" y="92" width="4" height="4"/>
                            <rect fill="#2563eb" x="48" y="92" width="4" height="4"/>
                            <rect fill="#2563eb" x="60" y="92" width="4" height="4"/>
                            <rect fill="#2563eb" x="76" y="92" width="4" height="4"/>
                            <rect fill="#2563eb" x="88" y="92" width="4" height="4"/>
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-center">Your QR Code</p>
                        <p className="text-xs text-foreground/60 text-center mt-2 px-4">
                          Present this code for colleges to scan at your fair
                        </p>
                      </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full blur-xl" />
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-500/20 rounded-full blur-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="student-benefits" className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-b from-white to-secondary/20">
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className={`text-center ${benefitsVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Students Love <span className="text-primary">CardCapture</span>
            </h2>

            <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-blue-50/50 border border-blue-200/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Save Time</h3>
                <p className="text-foreground/70">
                  Scan once instead of writing your info 20 times
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Your Choice</h3>
                <p className="text-foreground/70">
                  Use your phone or fill out an inquiry card—it's up to you
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-purple-50/50 border border-purple-200/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Stay Private</h3>
                <p className="text-foreground/70">
                  Control what info you share with each school
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="student-how-it-works" className="relative py-20 md:py-24 overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className={`text-center mb-16 ${howItWorksVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold">
              How It <span className="text-primary">Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Register",
                description: "Fill out your profile once",
                icon: <UserPlus className="h-16 w-16 text-primary/60" strokeWidth={1.5} />,
                bgClass: "from-primary/10 to-blue-100/50"
              },
              {
                step: "2",
                title: "Receive Your QR Code",
                description: "Get it via email and text",
                icon: <Mail className="h-16 w-16 text-emerald-500/60" strokeWidth={1.5} />,
                bgClass: "from-emerald-50 to-green-100/50"
              },
              {
                step: "3",
                title: "Share with Colleges",
                description: "Present your code at any booth",
                icon: <Share2 className="h-16 w-16 text-purple-500/60" strokeWidth={1.5} />,
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

          {/* Alt path note */}
          <div className={`mt-12 text-center ${howItWorksVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '600ms' }}>
            <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-foreground/10">
              <FileText className="h-6 w-6 text-foreground/60" />
              <p className="text-foreground/70">
                <span className="font-semibold">No QR code?</span> Fill out an inquiry card at the booth
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="student-faq" className="relative py-20 md:py-24 overflow-hidden bg-secondary/20">
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <div className={`${faqVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold">
                Questions?
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-foreground/10 overflow-hidden"
                >
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-semibold text-lg">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-foreground/60 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-foreground/60 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5">
                      <p className="text-foreground/70">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready for Your <span className="opacity-80">Next College Fair?</span>
          </h2>
          <p className="text-xl md:text-2xl opacity-90 mb-10">
            Get your QR code now and make every fair easier
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-6"
              onClick={() => navigate('/register')}
            >
              Get Your QR Code
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentLanding;
