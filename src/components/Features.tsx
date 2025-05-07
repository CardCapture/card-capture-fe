import { Camera, Database, FileSpreadsheet, Check, AlertTriangle, Zap, Shield, Clock, Brain, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Camera className="h-6 w-6 text-primary" />,
      title: "Smart Capture",
      description: "Take photos of handwritten cards or upload existing images. Our advanced OCR technology handles the rest.",
    },
    {
      icon: <Brain className="h-6 w-6 text-green-500" />,
      title: "AI-Powered Review",
      description: "Our AI reviewer does the first pass, reducing manual data entry by 80%. Humans review and clean up what's left.",
    },
    {
      icon: <Check className="h-6 w-6 text-blue-500" />,
      title: "Accurate Recognition",
      description: "State-of-the-art handwriting recognition with high accuracy, even for challenging handwriting styles.",
    },
    {
      icon: <Database className="h-6 w-6 text-indigo-500" />,
      title: "CRM Integration",
      description: "Seamlessly sync with your favorite CRM systems through our secure API connections.",
    },
    {
      icon: <FileSpreadsheet className="h-6 w-6 text-amber-500" />,
      title: "Flexible Export",
      description: "Export to CSV, Excel, or directly to your CRM. Customize export formats to match your needs.",
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-purple-500" />,
      title: "Smart Validation",
      description: "Automated data validation ensures accuracy and flags potential issues for review.",
    },
    {
      icon: <Shield className="h-6 w-6 text-orange-500" />,
      title: "Secure Storage",
      description: "Enterprise-grade security with encrypted storage and secure data transmission.",
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: "Bulk Processing",
      description: "Handle large volumes of cards efficiently with our bulk processing capabilities.",
    },
  ];

  return (
    <>
      {/* Features Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Modern Recruitment</h2>
            <p className="text-lg text-foreground/70">
              Transform your recruitment process with our comprehensive suite of features designed for efficiency and accuracy.
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-foreground/70">
              Get started in minutes with our streamlined process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Capture</h3>
              <p className="text-foreground/70">
                Take photos of your prospect cards or upload existing images.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Review</h3>
              <p className="text-foreground/70">
                Our AI reviewer does the first pass, reducing manual data entry by 80%.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Human Review</h3>
              <p className="text-foreground/70">
                Review only the 20% of cards flagged by AI for verification.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Export</h3>
              <p className="text-foreground/70">
                Export your data to your preferred format or sync directly with your CRM.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Recruitment Process?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Join hundreds of recruitment teams who have streamlined their prospect card management with CardCapture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg"
              onClick={() => navigate('/get-started')}
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/pricing')}
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
