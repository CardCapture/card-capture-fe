import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import CameraCapture from './card-scanner/CameraCapture';

// Interface for Camera-Only Scanner
interface CardScannerProps {
  onImageCaptured: (imageDataUrl: string) => void; // Callback with captured image data URL
  onScanComplete?: () => void; // Callback to close modal on cancel/error
}

const CardScanner = ({ onImageCaptured, onScanComplete }: CardScannerProps) => {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    handleCameraStart(); // Start camera on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCameraStart = async () => {
    try {
      setIsCapturing(true);
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Check permissions.",
        variant: "destructive",
      });
      setIsCapturing(false);
      onScanComplete?.(); // Close modal on error
    }
  };

  const handleCapture = (imageDataUrl: string) => {
    setIsCapturing(false);
    onImageCaptured(imageDataUrl); // Send data back to ScanFab
  };

  const handleCancel = () => {
      setIsCapturing(false);
      onScanComplete?.(); // Close modal
  }

  return (
    <div className="w-full">
        {isCapturing ? (
            <CameraCapture
                onCapture={handleCapture}
                onCancel={handleCancel}
            />
        ) : (
            <div className="text-center p-4 h-60 flex items-center justify-center">
                Initializing Camera...
            </div>
        )}
    </div>
  );
};

export default CardScanner;
