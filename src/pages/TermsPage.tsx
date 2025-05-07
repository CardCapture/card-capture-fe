import { useEffect } from 'react';
import { Mail } from 'lucide-react';

const TermsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center py-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Last updated: April 22, 2025
        </p>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16 space-y-12">
        {/* Introduction */}
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">
            Welcome to Card Capture LLC ("Card Capture", "we", "our", or "us"). These Terms of Service ("Terms") govern your use of our website and services, including all associated features and functionality (the "Services").
          </p>
          
          <p className="text-lg font-medium">
            By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Services.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">1. Use of Services</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            Card Capture provides software tools to digitize handwritten prospect cards and streamline recruitment workflows. You agree to use the Services only for lawful purposes and in accordance with these Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">2. Account Registration</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            You may be required to create an account to access certain features. You agree to provide accurate and complete information and to keep it up-to-date. You are responsible for safeguarding your account credentials.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">3. Data Ownership & Usage</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            You retain all rights to the data and content you upload or submit through the Services. By using our Services, you grant Card Capture a limited license to store, process, and use your content solely for the purpose of providing and improving the Services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">4. Third-Party Services</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            Card Capture uses trusted third-party providers to power certain features of our Services. While we choose reputable vendors, we are not responsible for any outages, data loss, or issues caused by these third-party platforms. Your use of their services is subject to their respective terms and privacy policies.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">5. Privacy</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            We take your privacy seriously. Please review our Privacy Policy to understand how we collect, use, and protect your information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">6. Acceptable Use</h2>
          <p className="text-base leading-relaxed text-foreground/80">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80">
            <li>Use the Services to violate any law or regulation</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with the normal operation of the Services</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">7. Service Availability</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            We strive to provide a reliable and high-uptime service, but we do not guarantee uninterrupted access. The Services may occasionally be unavailable due to maintenance, upgrades, or issues with third-party providers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">8. Termination</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            We reserve the right to suspend or terminate your account if you violate these Terms or misuse the Services. You may also stop using the Services at any time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">9. Limitation of Liability</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            To the fullest extent permitted by law, Card Capture shall not be liable for any indirect, incidental, special, or consequential damages, or any loss of data, profits, or business arising out of or in connection with your use of the Services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">10. Changes to Terms</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            We may update these Terms from time to time. If we make material changes, we will notify you by updating the "Last updated" date. Your continued use of the Services after such updates constitutes your acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">11. Contact Us</h2>
          <div className="flex items-center gap-2 text-base text-foreground/80">
            <span>For questions about these Terms, please contact:</span>
            <a 
              href="mailto:support@cardcapture.io" 
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <Mail className="h-4 w-4" />
              support@cardcapture.io
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsPage; 