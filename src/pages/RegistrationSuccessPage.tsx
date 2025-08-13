import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Mail, ArrowRight, Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function RegistrationSuccessPage() {
  const location = useLocation();
  const { verified, message, token, qrDataUri } = location.state || {};
  
  const handleDownloadQR = () => {
    if (!qrDataUri) return;
    
    const link = document.createElement('a');
    link.href = qrDataUri;
    link.download = 'cardcapture-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 px-6">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
              verified ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {verified ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <Mail className="w-8 h-8 text-blue-600" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {verified ? "You're all set!" : "Registration Complete!"}
            </h1>

            <p className="text-gray-600 mb-6">
              {message || (verified 
                ? "Your registration is complete and verified."
                : "Your registration is complete. Check your email to verify your address."
              )}
            </p>

            {/* Display QR Code if available */}
            {qrDataUri && verified && (
              <div className="mb-6">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-900 mb-3 text-center flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Your Personal QR Code
                  </h3>
                  <div className="flex flex-col items-center">
                    <img 
                      src={qrDataUri} 
                      alt="Your QR Code" 
                      className="w-48 h-48 border-2 border-gray-100 rounded-lg p-2"
                    />
                    {token && (
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">Access Code:</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {token}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={handleDownloadQR}
                  variant="outline" 
                  className="w-full mb-4"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    Show this QR code at college fairs to instantly share your information with schools using CardCapture.
                  </p>
                </div>
              </div>
            )}

            {!verified && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <h3 className="font-medium text-blue-900 mb-1">
                      Verify Your Email
                    </h3>
                    <p className="text-sm text-blue-700">
                      We sent you a verification email. Click the link to confirm your email address and complete your registration.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {verified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Your information is ready to share at college fairs
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Link to="/">
                  <Button className="w-full" size="lg">
                    Continue to CardCapture
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                You can update your information anytime by contacting support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}