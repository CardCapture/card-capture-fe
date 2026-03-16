import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  Users,
  QrCode,
  FileText,
  Calendar,
  Camera,
  Download,
  Brain,
  Database,
  FileCheck,
  Zap,
  WifiOff,
  Share2,
  ShieldCheck,
  Palette,
  Building2,
  Package
} from 'lucide-react';
import ccLogoOnly from '../../../assets/cc-logo-only.svg';
import ccLogoPoster from '../../../assets/cc-logo-only-transparent.png';

const RecruiterLanding = () => {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const [problemVisible, setProblemVisible] = useState(false);
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [qrCardVisible, setQrCardVisible] = useState(false);
  const [whiteLabelVisible, setWhiteLabelVisible] = useState(false);

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
      createObserver('recruiter-problem', setProblemVisible),
      createObserver('recruiter-solution', setSolutionVisible),
      createObserver('recruiter-how-it-works', setHowItWorksVisible),
      createObserver('recruiter-features', setFeaturesVisible),
      createObserver('recruiter-qr-card', setQrCardVisible),
      createObserver('recruiter-white-label', setWhiteLabelVisible),
    ];

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center py-16 md:py-20 overflow-hidden bg-white">
        <div className="absolute top-32 right-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-[15%] w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />

        <div className="w-full mx-auto relative z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className={`space-y-12 ${heroVisible ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="text-center space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                  Capture Every Student
                  <br />
                  <span className="text-primary">At Every Fair</span>
                </h1>

                <p className="text-xl md:text-2xl text-foreground/70 font-medium max-w-3xl mx-auto">
                  Scan student QR codes or handwritten inquiry cards
                  <br />
                  <span className="text-primary">One app for both</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6"
                    onClick={() => navigate('/signup')}
                  >
                    Sign Up & Select an Event
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6"
                    onClick={() => navigate('/get-started')}
                  >
                    Schedule a Demo
                  </Button>
                </div>

                <p className="text-sm text-foreground/50">
                  2-minute setup · No coordinator setup required · Export to Slate or CSV
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

      {/* Problem Section */}
      <section id="recruiter-problem" className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-b from-white to-secondary/20">
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className={`text-center ${problemVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              QR-Only Solutions <span className="text-primary">Leave Students Behind</span>
            </h2>

            <p className="text-lg text-foreground/70 mb-12 max-w-2xl mx-auto">
              Not every student can participate with digital-only systems
            </p>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-red-50/50 border border-red-200/50">
                <div className="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">Device-Free Campuses</h3>
                <p className="text-sm text-foreground/70">
                  Many schools prohibit phones at fairs entirely
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-yellow-50/50 border border-yellow-200/50">
                <div className="w-14 h-14 mx-auto mb-4 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-7 w-7 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">Unequal Access</h3>
                <p className="text-sm text-foreground/70">
                  Even when phones are allowed, not all students have a QR code ready
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-200/50">
                <div className="w-14 h-14 mx-auto mb-4 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Share2 className="h-7 w-7 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">Fill Once, Share Everywhere</h3>
                <p className="text-sm text-foreground/70">
                  Students enter their info once and share it with every school
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR or Card Section */}
      <section id="recruiter-qr-card" className="relative py-20 md:py-24 overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className={`${qrCardVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                QR Code or Paper Card. <span className="text-primary">One App for Both.</span>
              </h2>
              <p className="text-xl text-foreground/70 mt-4">
                Every student can share their information, regardless of device access
              </p>
            </div>

            {/* Visual: QR + Paper -> Every Student */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-3xl mx-auto">
              <div className="flex-1 text-center p-6 rounded-2xl bg-blue-50/50 border border-blue-200/50">
                <QrCode className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                <p className="font-semibold">QR Code</p>
                <p className="text-sm text-foreground/60 mt-1">Students with devices</p>
              </div>
              <div className="text-3xl text-foreground/30">+</div>
              <div className="flex-1 text-center p-6 rounded-2xl bg-green-50/50 border border-green-200/50">
                <FileText className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <p className="font-semibold">Inquiry Card</p>
                <p className="text-sm text-foreground/60 mt-1">Handwritten, then photographed</p>
              </div>
              <div className="text-3xl text-foreground/30">=</div>
              <div className="flex-1 text-center p-6 rounded-2xl bg-primary/10 border border-primary/30">
                <Users className="h-12 w-12 mx-auto mb-3 text-primary" />
                <p className="font-semibold">Every Student</p>
                <p className="text-sm text-foreground/60 mt-1">100% participation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - AI Handwriting */}
      <section id="recruiter-solution" className="relative py-20 md:py-24 overflow-hidden bg-secondary/20">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className={`${solutionVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                AI-Powered <span className="text-primary">Handwriting Recognition</span>
              </h2>
              <p className="text-xl text-foreground/70 mt-4">
                Inquiry cards are automatically transcribed. No manual data entry required
              </p>
            </div>

            {/* Demo Video */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="relative aspect-[16/10] rounded-3xl border-2 border-foreground/10 shadow-2xl overflow-hidden bg-white">
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

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-white rounded-2xl shadow-md flex items-center justify-center">
                  <Brain className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">AI Transcription</h3>
                <p className="text-sm text-foreground/60">Handwriting converted to digital data automatically</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-white rounded-2xl shadow-md flex items-center justify-center">
                  <FileCheck className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Review Flagged Entries</h3>
                <p className="text-sm text-foreground/60">Only verify what the AI isn't confident about</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-white rounded-2xl shadow-md flex items-center justify-center">
                  <Zap className="h-7 w-7 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Instant Processing</h3>
                <p className="text-sm text-foreground/60">Data ready for export within hours, not days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="recruiter-how-it-works" className="relative py-20 md:py-24 overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className={`text-center mb-16 ${howItWorksVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold">
              From Fair to CRM <span className="text-primary">in 3 Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Select Your Event",
                description: "Choose from our universal event catalog",
                icon: <Calendar className="h-16 w-16 text-primary/60" strokeWidth={1.5} />,
                bgClass: "from-primary/10 to-blue-100/50"
              },
              {
                step: "2",
                title: "Capture Student Data",
                description: "Scan QR codes or photograph inquiry cards",
                icon: <Camera className="h-16 w-16 text-emerald-500/60" strokeWidth={1.5} />,
                bgClass: "from-emerald-50 to-green-100/50"
              },
              {
                step: "3",
                title: "Export to Slate or CSV",
                description: "All data, one seamless export",
                icon: <Download className="h-16 w-16 text-blue-500/60" strokeWidth={1.5} />,
                bgClass: "from-blue-50 to-indigo-100/50"
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

      {/* Features Section */}
      <section id="recruiter-features" className="relative py-20 md:py-24 overflow-hidden bg-secondary/20">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className={`${featuresVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold">
                Why Admissions Teams <span className="text-primary">Choose CardCapture</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { icon: <Smartphone className="h-7 w-7 text-primary" />, title: "Works on Device-Free Campuses", description: "The only solution for schools that ban phones", bgColor: "bg-primary/10" },
                { icon: <Users className="h-7 w-7 text-emerald-600" />, title: "Greater Student Adoption", description: "Every student can participate, not just those with devices", bgColor: "bg-emerald-500/10" },
                { icon: <WifiOff className="h-7 w-7 text-purple-600" />, title: "Offline Capable", description: "Works without WiFi at crowded fairs", bgColor: "bg-purple-500/10" },
                { icon: <Database className="h-7 w-7 text-blue-600" />, title: "Slate & CSV Export", description: "Direct integration or flexible file export", bgColor: "bg-blue-500/10" },
                { icon: <FileText className="h-7 w-7 text-rose-600" />, title: "Universal Inquiry Cards", description: "Standard cards work at any fair", bgColor: "bg-rose-500/10" },
                { icon: <Zap className="h-7 w-7 text-yellow-600" />, title: "Cost Effective", description: "Affordable for universities of any size", bgColor: "bg-yellow-500/10" },
              ].map((feature, index) => (
                <div key={index} className="text-center p-6 rounded-2xl bg-white border border-foreground/5 shadow-sm">
                  <div className={`w-14 h-14 mx-auto mb-4 ${feature.bgColor} rounded-2xl flex items-center justify-center`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-foreground/60">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* White-Label Cards Section */}
      <section id="recruiter-white-label" className="relative py-20 md:py-24 overflow-hidden bg-white">
        <div className="absolute -top-20 -left-20 w-[420px] h-[420px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-[360px] h-[360px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className={`${whiteLabelVisible ? 'animate-fade-in' : 'opacity-0'}`}>

            {/* Eyebrow + Heading */}
            <div className="text-center mb-16">
              <span className="inline-block bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full border border-primary/25 mb-5">
                White-Label Cards
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-5">
                Your Brand. <span className="text-primary">Your Cards.</span>
              </h2>
              <p className="text-lg text-foreground/60 max-w-lg mx-auto">
                Custom inquiry cards with your logo and colors, fully compatible with CardCapture's AI transcription.
              </p>
            </div>

            {/* Hero Layout: Card Mockup + Value Props */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">

              {/* Left: McMurry branded card mockup (full card) */}
              <div className="relative">
                <div className="absolute -inset-5 bg-primary/5 rounded-3xl blur-[30px]" />
                <div className="absolute top-4 left-4 -right-4 -bottom-4 bg-[#f0e4e8] rounded-2xl border border-[#701931]/15" />
                <div className="absolute top-2 left-2 -right-2 -bottom-2 bg-[#f5ecef] rounded-2xl border border-[#701931]/15" />

                {/* Main card face */}
                <div className="relative bg-white rounded-2xl border border-[#701931]/20 shadow-[0_20px_60px_rgba(0,0,0,0.10),0_4px_16px_rgba(112,25,49,0.12)] overflow-hidden">
                  {/* Maroon swoosh header */}
                  <div className="relative bg-[#701931] h-[72px] overflow-hidden">
                    <div className="absolute -top-5 -right-10 w-44 h-44 bg-white/5 rounded-full" />
                    <div className="absolute bottom-0 left-0 right-0 h-5 bg-white rounded-t-[50%]" />
                    <p className="relative z-10 text-center pt-4 text-white text-base font-bold tracking-[0.2em] uppercase">
                      Inquiry Card
                    </p>
                  </div>

                  <div className="px-8 pb-7 pt-3">
                    {/* Row 1: First Name, Last Name */}
                    <div className="grid grid-cols-2 gap-x-4 mb-4">
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">First Name</p>
                      </div>
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">Last Name</p>
                      </div>
                    </div>
                    {/* Row 2: Preferred Name, Cell Phone */}
                    <div className="grid grid-cols-2 gap-x-4 mb-4">
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">Preferred Name</p>
                      </div>
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">Cell Phone</p>
                      </div>
                    </div>
                    {/* Row 3: Email */}
                    <div className="mb-4">
                      <div className="h-6 border-b-[1.5px] border-gray-300" />
                      <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">Email Address</p>
                    </div>
                    {/* Row 4: Street Address */}
                    <div className="mb-4">
                      <div className="h-6 border-b-[1.5px] border-gray-300" />
                      <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">Street Address</p>
                    </div>
                    {/* Row 5: City, State, Zip */}
                    <div className="grid grid-cols-[1.4fr_0.6fr_1fr] gap-x-4 mb-4">
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">City</p>
                      </div>
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">State</p>
                      </div>
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">Zip Code</p>
                      </div>
                    </div>
                    {/* Row 6: High School, DOB */}
                    <div className="grid grid-cols-[1fr_0.5fr] gap-x-4 mb-4">
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">High School</p>
                      </div>
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">Date of Birth</p>
                      </div>
                    </div>
                    {/* Row 7: Major, Grad Year, GPA, SAT, ACT */}
                    <div className="grid grid-cols-[1.4fr_0.5fr_0.35fr_0.35fr_0.35fr] gap-x-3 mb-4">
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">Potential Major</p>
                      </div>
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">Grad Year</p>
                      </div>
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">GPA</p>
                      </div>
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">SAT</p>
                      </div>
                      <div>
                        <div className="h-6 border-b-[1.5px] border-gray-300" />
                        <p className="text-[10px] font-semibold text-[#701931] uppercase tracking-wide mt-1">ACT</p>
                      </div>
                    </div>
                    {/* Text permission checkbox */}
                    <div className="flex items-center justify-center gap-5 py-3 mb-4">
                      <span className="text-[11px] font-semibold text-[#701931]">May we text you?</span>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 border-2 border-[#701931] rounded-sm" />
                          <span className="text-[11px] font-semibold text-[#701931]">Yes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 border-2 border-[#701931] rounded-sm" />
                          <span className="text-[11px] font-semibold text-[#701931]">No</span>
                        </div>
                      </div>
                    </div>

                    {/* McMurry logo footer */}
                    <div className="text-center pt-4 border-t border-gray-200">
                      <img
                        src="https://ftlweumoajawitlszpqx.supabase.co/storage/v1/object/public/assets/mcmurry-logo-horiz.png"
                        alt="McMurry University"
                        className="h-12 mx-auto"
                      />
                    </div>

                    {/* Powered by CardCapture */}
                    <div className="flex items-center justify-center gap-1.5 mt-5 text-[9px] text-gray-400">
                      <img src={ccLogoOnly} alt="CC" className="w-3.5 h-3.5" />
                      Powered by CardCapture
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Value propositions */}
              <div className="flex flex-col gap-5">
                {[
                  {
                    icon: <Palette className="h-5 w-5 text-primary" />,
                    title: 'Fully Branded',
                    description: 'Your logo, colors, and fields on professional card stock, shipped to your door.',
                  },
                  {
                    icon: <Brain className="h-5 w-5 text-primary" />,
                    title: 'Same AI, Zero Extra Steps',
                    description: 'White-label cards work with CardCapture identically to standard cards. No reconfiguration needed.',
                  },
                  {
                    icon: <Building2 className="h-5 w-5 text-primary" />,
                    title: 'Great for Your Own Events',
                    description: 'Open houses, campus tours, and institution-hosted fairs where your brand should be front and center.',
                  },
                  {
                    icon: <Package className="h-5 w-5 text-primary" />,
                    title: 'Bulk Ordering, Fast Turnaround',
                    description: 'Custom quotes for any quantity. Small runs or large-volume orders.',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 items-start p-5 bg-primary/[0.03] border border-primary/10 rounded-2xl"
                  >
                    <div className="w-11 h-11 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-foreground/60">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Use Cases */}
            <div className="mb-20">
              <h3 className="text-center text-2xl md:text-3xl font-bold mb-8">
                Built for Every Scenario
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <Building2 className="h-7 w-7 text-primary" />,
                    title: 'Open Houses',
                    description: 'Branded cards reinforce your identity when students visit campus.',
                  },
                  {
                    icon: <Share2 className="h-7 w-7 text-primary" />,
                    title: 'Regional Tours',
                    description: 'Make a lasting impression at smaller markets and private school visits.',
                  },
                  {
                    icon: <Users className="h-7 w-7 text-primary" />,
                    title: 'College Fairs You Host',
                    description: 'Use your branded cards at your booth or provide them to visiting institutions.',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border border-foreground/5 rounded-2xl p-7 shadow-sm"
                  >
                    <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                      {item.icon}
                    </div>
                    <h4 className="text-base font-bold text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-foreground/60">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* White-Label CTA Block */}
            <div className="relative bg-primary rounded-3xl p-12 md:p-16 text-center overflow-hidden">
              <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/[0.07] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/[0.05] rounded-full pointer-events-none" />

              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Put Your Brand on Every Card
                </h2>
                <p className="text-base text-white/85 max-w-md mx-auto mb-8">
                  Tell us your branding and quantity. Custom quote within one business day.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8 py-6"
                    onClick={() => navigate('/get-started')}
                  >
                    Request a Quote
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-lg px-8 py-6 border-2 border-white/50 text-white bg-transparent hover:bg-white/10 hover:border-white/70"
                    onClick={() => navigate('/get-started')}
                  >
                    Schedule a Demo
                  </Button>
                </div>
                <p className="text-xs text-white/60 mt-6">
                  No minimum order · Proofs before printing · Ships nationwide
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Capture <span className="opacity-80">Every Student?</span>
          </h2>
          <p className="text-xl md:text-2xl opacity-90 mb-10">
            Join admissions teams using CardCapture at college fairs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-6"
              onClick={() => navigate('/signup')}
            >
              Sign Up & Select an Event
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-lg px-10 py-6 border-2 border-white/50 text-white bg-transparent hover:bg-white/10 hover:border-white/70"
              onClick={() => navigate('/docs#recruiters')}
            >
              View Recruiter Guide
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Questions? <a href="/get-started" className="underline hover:opacity-100">Schedule a demo</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default RecruiterLanding;
