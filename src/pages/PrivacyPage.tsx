import { useEffect } from 'react';
import { Mail } from 'lucide-react';

const PrivacyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center py-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Last updated: April 22, 2025
          </p>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16">
          <div className="space-y-12">
            {/* Introduction */}
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">
                At Card Capture LLC ("Card Capture", "we", "our", or "us"), we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Information We Collect</h2>
              <p className="text-base leading-relaxed text-foreground/80">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Account information (name, email, organization)</li>
                <li>Prospect card data you upload or scan</li>
                <li>Usage data and preferences</li>
                <li>Communication records with our support team</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
              <p className="text-base leading-relaxed text-foreground/80">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Provide and improve our services</li>
                <li>Process and digitize prospect cards</li>
                <li>Communicate with you about your account</li>
                <li>Send important updates and notifications</li>
                <li>Analyze and improve our services</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Data Security</h2>
              <p className="text-base leading-relaxed text-foreground/80">
                We implement appropriate technical and organizational measures to protect your personal information. This includes encryption, secure data storage, and regular security assessments.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Data Sharing</h2>
              <p className="text-base leading-relaxed text-foreground/80">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Service providers who assist in our operations</li>
                <li>Legal authorities when required by law</li>
                <li>Third parties with your explicit consent</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Your Rights</h2>
              <p className="text-base leading-relaxed text-foreground/80">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">6. Cookies and Tracking</h2>
              <p className="text-base leading-relaxed text-foreground/80">
                We use cookies and similar technologies to improve your experience, understand usage patterns, and provide better services. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">7. Changes to Privacy Policy</h2>
              <p className="text-base leading-relaxed text-foreground/80">
                We may update this Privacy Policy periodically. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">8. Contact Us</h2>
              <div className="flex items-center gap-2 text-base text-foreground/80">
                <span>For questions about our Privacy Policy, please contact:</span>
                <a 
                  href="mailto:privacy@cardcapture.io" 
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  privacy@cardcapture.io
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage; 