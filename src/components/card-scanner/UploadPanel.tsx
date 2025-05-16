import { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface UploadPanelProps {
  onCameraStart: () => void;
  onFileUpload: (file: File) => void;
}

const UploadPanel = ({ onCameraStart, onFileUpload }: UploadPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Camera size={24} className="text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2">Capture or Upload Card</h3>
      <p className="text-sm text-foreground/70 mb-6">
        Take a picture of a handwritten card or upload an existing image to begin processing
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={onCameraStart} className="rounded-full">
          <Camera className="mr-2 h-4 w-4" />
          Capture Card
        </Button>
        <Button onClick={triggerFileInput} variant="outline" className="rounded-full">
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default UploadPanel;
