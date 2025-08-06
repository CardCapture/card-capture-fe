import { Camera, Database, FileSpreadsheet, Check, AlertTriangle, Zap, Shield, Clock, Brain, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "12x Faster Processing",
      description: "Go from 3 minutes per card to just 15 seconds. Transform your most time-consuming task into your fastest.",
    },
    {
      icon: <Zap className="h-6 w-6 text-green-500" />,
      title: "24-Hour Follow-Up",
      description: "Reach prospective students within 24 hours of an event — while they're still excited about your school.",
    },
    {
      icon: <Database className="h-6 w-6 text-blue-500" />,
      title: "Direct CRM Integration",
      description: "Send data straight to Slate with our secure SFTP connection. No manual imports required.",
    },
    {
      icon: <Brain className="h-6 w-6 text-indigo-500" />,
      title: "AI-Powered Accuracy",
      description: "Advanced AI reads handwriting with high accuracy, even for challenging writing styles.",
    },
    {
      icon: <Camera className="h-6 w-6 text-amber-500" />,
      title: "Simple Capture",
      description: "Just take photos with your phone or upload existing images. No special equipment needed.",
    },
    {
      icon: <Check className="h-6 w-6 text-purple-500" />,
      title: "Smart Validation",
      description: "Automated data validation catches errors and flags only what needs human review.",
    },
    {
      icon: <FileSpreadsheet className="h-6 w-6 text-orange-500" />,
      title: "Flexible Export",
      description: "Export to CSV, Excel, or send directly to your CRM. Works with any enrollment system.",
    },
    {
      icon: <UserCheck className="h-6 w-6 text-yellow-500" />,
      title: "Bulk Processing",
      description: "Upload and process hundreds of cards at once. Perfect for large events and college fairs.",
    },
  ];

  return (
    <>
      {/* Features Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Stop Losing Leads to Slow Data Entry</h2>
            <p className="text-xl md:text-2xl font-medium text-foreground/90 leading-relaxed tracking-tight">
              Get cards into your CRM <span className="font-bold text-primary">today</span> Follow up <span className="font-bold text-primary">tomorrow</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="glass-panel p-6 rounded-xl card-shine hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Complete Process</h2>
            <p className="text-lg md:text-xl font-medium text-foreground/90 leading-relaxed tracking-tight max-w-4xl mx-auto">
              Turn cards into leads <span className="font-bold text-primary">instantly</span> Engage with prospects and reclaim your <span className="font-bold text-primary">time</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Capture</h3>
              <p className="text-foreground/70">
                Snap photos of inquiry cards with your phone or upload existing images
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
              <p className="text-foreground/70">
                Advanced AI extracts student data from handwritten cards
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Review</h3>
              <p className="text-foreground/70">
                Review and approve the data in one click. Only flagged fields need attention
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Export</h3>
              <p className="text-foreground/70">
                Send clean data to Slate automatically or export to CSV. Start follow-up within hours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Grant's Photo - Left Side */}
              <div className="flex justify-center lg:justify-start">
                <img 
                  src="https://assets.cardcapture.io/storage/v1/object/public/assets//grant.jpeg" 
                  alt="Dr. Grant Greenwood"
                  className="w-48 h-48 lg:w-56 lg:h-56 rounded-2xl object-cover shadow-lg"
                />
              </div>
              
              {/* Quote - Right Side */}
              <div className="lg:col-span-2 text-center lg:text-left">
                <blockquote className="text-xl md:text-2xl font-medium text-foreground mb-6 lg:mb-8 leading-relaxed">
                  "CardCapture turned hours of data entry into minutes — and now we’re following up with students the day after every event."
                </blockquote>
                <div className="flex flex-col lg:items-start items-center">
                  <div className="font-semibold text-xl mb-1">Dr. Grant Greenwood</div>
                  <div className="text-foreground/70 text-lg">VP of Enrollment Management</div>
                  <div className="text-foreground/70 text-lg">McMurry University</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Ditch Data Entry?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Join admissions teams who've cut their lead processing time by <b>12x</b> and improved their yield with <b>faster follow-up</b>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg"
              onClick={() => navigate('/get-started')}
            >
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
