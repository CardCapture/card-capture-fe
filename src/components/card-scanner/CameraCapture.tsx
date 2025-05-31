import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 3840 },
            height: { ideal: 2160 },
            aspectRatio: { ideal: 4/3 }
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please ensure you have granted camera permissions.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL
    const imageDataUrl = canvas.toDataURL('image/png');
    
    // Stop the camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    onCapture(imageDataUrl);
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <div className="text-red-500">
            <p>{error}</p>
            <Button onClick={onCancel} variant="outline" className="mt-4">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
            <Button onClick={onCancel} variant="outline" className="bg-white/90 backdrop-blur-sm hover:bg-white">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={captureImage} className="bg-green-600 hover:bg-green-700">
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
