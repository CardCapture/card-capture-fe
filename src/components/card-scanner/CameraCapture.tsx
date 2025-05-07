
import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const CameraCapture = ({ onCapture, onCancel }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      
      // Stop camera stream
      const stream = video.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
      
      onCapture(imageDataUrl);
    }
  };

  return (
    <>
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <Button 
            onClick={captureImage}
            size="lg"
            className="rounded-full animate-pulse bg-white text-primary hover:bg-white/90"
          >
            <Camera size={24} />
          </Button>
        </div>
      </div>
      
      <div className="mt-6 flex gap-4 justify-center">
        <Button onClick={onCancel} variant="outline" className="rounded-full px-6">
          Cancel
        </Button>
      </div>
      
      {/* Hidden canvas for capturing image */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default CameraCapture;
