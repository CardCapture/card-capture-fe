import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft } from 'lucide-react';
import { useCameraPermission } from '@/hooks/useCameraPermission';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();

  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    // Set initial orientation
    handleOrientationChange();

    // Listen for resize/orientation changes
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Initialize camera
  useEffect(() => {
    let localStream: MediaStream | null = null;
    let cancelled = false;

    const initializeCamera = async () => {
      try {
        // Get camera stream
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 3840 },
            height: { ideal: 2160 },
            aspectRatio: { ideal: 4/3 }
          }
        });

        if (!cancelled) {
          setStream(localStream);
        } else {
          localStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        setError('Unable to access camera. Please ensure you have granted camera permissions.');
      }
    };

    initializeCamera();

    return () => {
      cancelled = true;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Assign stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/png');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    onCapture(imageDataUrl);
  };

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden flex flex-col">
      {/* Back arrow in top-left */}
      <button
        type="button"
        className="absolute top-4 left-4 z-20 bg-black/60 rounded-full p-2 text-white hover:bg-black/80"
        onClick={onCancel}
        aria-label="Back"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      {/* Camera preview */}
      {error ? (
        <div className="flex-1 flex items-center justify-center text-red-500 text-center p-4">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-xl"
            style={{ minHeight: 320 }}
          />
          <canvas ref={canvasRef} className="hidden" />
          {/* Capture button - positioned based on orientation */}
          <div
            className={`absolute z-20 ${
              isLandscape
                ? 'right-8 top-1/2 -translate-y-1/2' // Right edge, vertically centered in landscape
                : 'bottom-8 left-1/2 -translate-x-1/2' // Bottom edge, horizontally centered in portrait
            }`}
          >
            <Button
              onClick={captureImage}
              className="rounded-full bg-green-600 hover:bg-green-700 shadow-lg w-16 h-16 flex items-center justify-center text-white text-lg"
              style={{ fontSize: 24 }}
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
