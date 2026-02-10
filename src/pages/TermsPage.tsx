import { useEffect } from 'react';
import { Mail } from 'lucide-react';

const TermsPage = () => {
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
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

        {/* Student Terms of Service */}
        <section id="student-terms" className="space-y-8 scroll-mt-8 border-t pt-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Student Terms of Service</h2>
            <p className="text-base leading-relaxed text-foreground/80">
              The following additional terms apply when you access or use the CardCapture platform as a student or prospective student exploring educational opportunities. These Student Terms supplement the general Terms of Service above. In the event of a conflict, these Student Terms shall control with respect to student use of the Platform.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S1. Who May Use CardCapture</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              CardCapture is designed for students and prospective students exploring educational opportunities. By using the Platform, you confirm that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>You are 18 years of age or older, or</li>
              <li>You are 13–17 years old and have permission from a parent or legal guardian, and</li>
              <li>You are not under the age of 13.</li>
            </ul>
            <p className="text-base leading-relaxed text-foreground/80">
              Use of CardCapture by anyone under 13 is strictly prohibited. CardCapture does not knowingly collect personal information from children under 13. If you provide false age or consent information, CardCapture may suspend or permanently disable your access.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S2. What CardCapture Does</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              CardCapture provides tools that allow students to voluntarily share information with colleges, universities, and other educational organizations ("Schools") through digital forms, QR codes, or similar methods. When you choose to share your information with a School:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>The School receives the information directly</li>
              <li>The School is responsible for how it uses that information</li>
              <li>CardCapture does not control School communications or decisions</li>
            </ul>
            <p className="text-base leading-relaxed text-foreground/80">
              CardCapture does not promise admission, scholarships, or enrollment outcomes.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S3. Information You Provide</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              You are responsible for the accuracy of the information you submit through CardCapture. By submitting information, you allow CardCapture to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Collect and store the information</li>
              <li>Deliver it to the Schools you interact with</li>
              <li>Operate and improve the Platform</li>
            </ul>
            <p className="text-base leading-relaxed text-foreground/80">
              Once your information is shared with a School, CardCapture is not responsible for that School's actions or policies.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S4. Messages and Notifications</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              By using CardCapture, you agree that CardCapture and Schools may contact you using:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Email</li>
              <li>Text messages</li>
              <li>Phone calls</li>
              <li>In-app notifications</li>
            </ul>
            <p className="text-base leading-relaxed text-foreground/80">
              Messages may relate to events, programs, deadlines, or follow-up information. Your mobile carrier's normal rates may apply. You may opt out of non-essential messages at any time.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S5. Rules for Using the Platform</h3>
            <p className="text-base leading-relaxed text-foreground/80">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Submit false or misleading information</li>
              <li>Pretend to be someone else</li>
              <li>Attempt to access systems you are not authorized to use</li>
              <li>Disrupt or damage the Platform</li>
              <li>Use the Platform for illegal purposes</li>
            </ul>
            <p className="text-base leading-relaxed text-foreground/80">
              CardCapture may restrict or terminate access if these rules are violated.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S6. Ownership of the Platform</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              The Platform and everything that powers it — including software, design, text, and logos — belongs to CardCapture or its licensors. You may not copy, sell, or reuse any part of the Platform without written permission.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S7. External Services</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              CardCapture may link to other websites or services. We do not control them and are not responsible for their content or practices.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S8. No Guarantees</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              CardCapture is provided as-is. We do not guarantee that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>The Platform will always work without interruption</li>
              <li>Information will be error-free</li>
              <li>Schools will respond or act in any particular way</li>
            </ul>
            <p className="text-base leading-relaxed text-foreground/80">
              You use CardCapture at your own discretion.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S9. Limits on Liability</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              To the fullest extent allowed by law, CardCapture will not be responsible for indirect or unexpected damages, including lost opportunities or issues arising from School communications. If CardCapture is found liable for any reason, the maximum total amount payable will be $100.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S10. Your Responsibility to CardCapture</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              If your actions cause legal claims or losses for CardCapture, you agree to cover those losses, including reasonable legal costs.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S11. Ending Access</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              You may stop using CardCapture at any time. CardCapture may suspend or end access if these Terms are violated or if the Platform is discontinued.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S12. Changes to These Terms</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              We may update these Terms occasionally. Continued use after updates means you accept the revised Terms.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">S13. Governing Law</h3>
            <p className="text-base leading-relaxed text-foreground/80">
              These Terms are governed by the laws of the State of Texas.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">12. Contact Us</h2>
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