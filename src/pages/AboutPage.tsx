import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import AboutCard from "@/components/about/AboutCard";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-muted/50 py-8 px-2 sm:px-0 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        {/* Section 1: Tagline + Overview */}
        <AboutCard>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Making Student Recruitment Effortless</h1>
          <p className="text-gray-600 text-base sm:text-lg">
            CardCapture streamlines the way admissions teams collect, review, and manage student interest cards. Our platform digitizes every card, flags missing info, and helps you focus on what matters most—building your next class.
          </p>
        </AboutCard>

        {/* Section 2: Key Benefits */}
        <AboutCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Key Benefits</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-gray-700"><CheckCircle2 className="text-green-600 w-5 h-5" /> Digitize cards instantly</li>
            <li className="flex items-center gap-2 text-gray-700"><CheckCircle2 className="text-green-600 w-5 h-5" /> Flag missing or incomplete info</li>
            <li className="flex items-center gap-2 text-gray-700"><CheckCircle2 className="text-green-600 w-5 h-5" /> Sync seamlessly to Slate</li>
          </ul>
        </AboutCard>

        {/* Section 3: Built for Admissions */}
        <AboutCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Built for Admissions</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Custom field preferences for every event</li>
            <li>AI-powered reviewer for fast, accurate data checks</li>
            <li>Smart review tools to flag and resolve issues</li>
            <li>Secure, FERPA-ready infrastructure</li>
          </ul>
        </AboutCard>

        {/* Section 4: Human Element */}
        <AboutCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Who We Are</h2>
          <p className="text-gray-600 text-base">
            We're a small, product-focused team building better tools for education. Every feature is designed with real admissions teams in mind. Have feedback? Reach us any time at <a href="mailto:support@cardcapture.io" className="text-blue-600 underline">support@cardcapture.io</a>.
          </p>
        </AboutCard>

        {/* Section 5: CTA */}
        <AboutCard className="flex flex-col items-center text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to capture your next class?</h2>
          <Button asChild size="lg" className="mt-2">
            <a href="/request-demo">Request a Demo</a>
          </Button>
        </AboutCard>
      </div>
    </div>
  );
} 