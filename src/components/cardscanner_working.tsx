import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ScannerResult } from '@/types/card';
import { useToast } from "@/hooks/use-toast";
import CameraCapture from './card-scanner/CameraCapture';
import ImagePreview from './card-scanner/ImagePreview';
import UploadPanel from './card-scanner/UploadPanel';
import { authFetch } from "@/lib/authFetch";

interface CardScannerProps {
  initialMode?: 'upload' | 'camera';
}

const CardScanner = ({ initialMode }: CardScannerProps) => {
  const { toast } = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScannerResult | null>(null);

  useEffect(() => {
    if (initialMode === 'camera') {
      handleCameraStart();
    }
  }, [initialMode]);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      setScanResult(null);
      setImage(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      });
      setIsCapturing(false);
      return null;
    }
  };

  const handleCameraStart = async () => {
    await startCamera();
  };

  const handleCapture = (imageDataUrl: string) => {
    setImage(imageDataUrl);
    setIsCapturing(false);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target?.result as string;
      setImage(imageDataUrl); // Show preview
      setScanResult(null);
      setIsCapturing(false);
      setIsProcessing(true);
      setProcessingProgress(0);
  
      const formData = new FormData();
      formData.append("file", file);
  
      // Simulate progress bar
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const next = prev + Math.random() * 10;
          return next > 95 ? 95 : next;
        });
      }, 300);
  
      try {
        // Send the image to the backend
        const response = await authFetch("http://localhost:8000/upload", {
          method: "POST",
          body: formData,
        });
  
        const data = await response.json();
        console.log("✅ Upload success:", data.message);
  
        // Handle the document_id returned from the backend
        if (data.document_id) {
          toast({
            title: "Upload Successful",
            description: "Your card has been sent for processing!",
            variant: "default",
          });
  
          // Store document_id in state if needed
          console.log("Document ID:", data.document_id);
        } else {
          console.error("❌ No document_id returned.");
          toast({
            title: "Error",
            description: "No document_id received from the backend.",
            variant: "destructive",
          });
        }
  
        setProcessingProgress(100); // Update the progress to 100%
  
      } catch (error) {
        console.error("❌ Upload failed:", error);
        toast({
          title: "Upload Failed",
          description: "An error occurred while uploading the image.",
          variant: "destructive",
        });
      } finally {
        clearInterval(progressInterval); // Clear progress interval
        setTimeout(() => setIsProcessing(false), 500); // Reset processing state
      }
    };
  
    reader.readAsDataURL(file); // Start reading the file
  };  

  const resetScan = () => {
    setImage(null);
    setScanResult(null);
    setIsCapturing(false);
    setIsProcessing(false);
    setProcessingProgress(0);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="glass-panel overflow-hidden shadow-xl">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Card Scanner</h2>

          {isCapturing ? (
            <CameraCapture
              onCapture={handleCapture}
              onCancel={() => setIsCapturing(false)}
            />
          ) : image ? (
            <ImagePreview
              image={image}
              isProcessing={isProcessing}
              processingProgress={processingProgress}
              scanResult={scanResult}
              onReset={resetScan}
            />
          ) : (
            <UploadPanel
              onCameraStart={handleCameraStart}
              onFileUpload={handleFileUpload}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default CardScanner;
