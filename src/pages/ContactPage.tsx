import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-muted/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            We're here to help
          </h1>
          <p className="text-lg text-gray-600">
            Have questions or need support? Reach out anytime.
          </p>
        </div>

        {/* Contact Card */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-5 h-5" />
                <span className="text-sm font-medium">Email us</span>
              </div>
              
              <a 
                href="mailto:support@cardcapture.io" 
                className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                support@cardcapture.io
              </a>
              
              <p className="text-sm text-gray-500 mt-2">
                We typically respond within 24 hours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage; 