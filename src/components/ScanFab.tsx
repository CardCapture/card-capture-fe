import { useState, useRef, useEffect } from 'react';
import { Plus, Camera, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CardScanner from '@/components/CardScanner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEvents } from '@/hooks/useEvents';
import { authFetch } from "@/lib/authFetch";

// Helper function
const dataURLtoFile = (dataurl: string, filename: string): File | null => {
     const arr = dataurl.split(',');
     if (!arr[0] || !arr[1]) return null;
     const mimeMatch = arr[0].match(/:(.*?);/);
     if (!mimeMatch) return null;
     const mime = mimeMatch[1];
     try {
         const bstr = atob(arr[1]);
         let n = bstr.length;
         const u8arr = new Uint8Array(n);
         while(n--){ u8arr[n] = bstr.charCodeAt(n); }
         return new File([u8arr], filename, {type:mime});
     } catch (e) { console.error("Error converting data URL:", e); return null; }
}

// No props needed from parent for this version
interface ScanFabProps {
  onUploadRequested?: (file: File) => Promise<void>;
  isUploadInProgress?: boolean;
  uploadProgress?: number;
}

const ScanFab = ({ onUploadRequested, isUploadInProgress = false, uploadProgress: parentUploadProgress }: ScanFabProps) => {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localUploadProgress, setLocalUploadProgress] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { events, loading: eventsLoading, fetchEvents } = useEvents();

  // Use parent progress if provided, otherwise use local progress
  const effectiveProgress = typeof parentUploadProgress === 'number' ? parentUploadProgress : localUploadProgress;

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const triggerFileInput = () => {
    setShowUploadDialog(true);
    setIsPopoverOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    if (file) {
      console.log('Selected event ID:', selectedEventId);
      if (!selectedEventId) {
        toast({ 
          title: "Event Required", 
          description: "Please select an event before uploading.", 
          variant: "destructive"
        });
        return;
      }
      setShowUploadDialog(false);
      startProcessing(file);
    }
    if (event.target) event.target.value = '';
  };

  const openCameraModal = () => {
    setIsCameraModalOpen(true);
    setIsPopoverOpen(false);
  };

  const startProcessing = async (file: File | null) => {
    console.log('Starting processing with file:', file);
    console.log('Selected event ID:', selectedEventId);
    
    if (!file) {
      toast({ title: "File Error", description: "No valid file provided.", variant: "destructive"});
      return;
    }

    if (!selectedEventId) {
      toast({ title: "Event Required", description: "Please select an event before uploading.", variant: "destructive"});
      return;
    }

    setIsUploading(true);
    setLocalUploadProgress(10);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("event_id", selectedEventId);
    console.log('FormData created:', {
      file: file.name,
      event_id: selectedEventId
    });
    const timer = setTimeout(() => setLocalUploadProgress(50 + Math.random() * 20), 600);

    try {
      // Always make the upload request directly, ignoring onUploadRequested
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      console.log('Making upload request to:', `${apiBaseUrl}/upload`);
      const response = await authFetch(`${apiBaseUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      setLocalUploadProgress(100);
      toast({
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium">
              Card uploaded successfully.
            </span>
          </div>
        ),
        duration: 3000,
      });
      setTimeout(() => { setIsUploading(false); setLocalUploadProgress(0); }, 1500);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload.",
        variant: "destructive",
      });
      setIsUploading(false);
      setLocalUploadProgress(0);
    }
  };

  const handleImageCaptured = (imageDataUrl: string) => {
    setIsCameraModalOpen(false);
    const capturedFile = dataURLtoFile(imageDataUrl, `capture-${Date.now()}.png`);
    startProcessing(capturedFile);
  }

  const testBackendConnection = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      console.log("ScanFab: Testing backend connection to:", `${apiBaseUrl}/test-connection`);
      
      const response = await authFetch(`${apiBaseUrl}/test-connection`);
      console.log("ScanFab: Test connection response", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw new Error(`Test connection failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("ScanFab: Test connection successful", data);
      
      toast({
        title: "Connection Successful",
        description: "Backend connection test completed successfully.",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("ScanFab: Test connection failed", {
        error: error.message,
        stack: error.stack
      });
      
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to connect to the backend server. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const handleScanClick = () => {
    setShowScanner(true);
  };

  const handleUploadClick = () => {
    setShowUploadDialog(true);
  };

  return (
    <>
      <Dialog open={isCameraModalOpen} onOpenChange={setIsCameraModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} ({new Date(event.date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CardScanner onImageCaptured={handleImageCaptured} onScanComplete={() => setIsCameraModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Card</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} ({new Date(event.date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-4">
        {isUploading && (
          <div className="bg-white rounded-lg shadow-lg p-4 w-64">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-gray-500">{Math.round(effectiveProgress)}%</span>
            </div>
            <Progress value={effectiveProgress} className="w-full" />
          </div>
        )}
        
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-48">
            <div className="flex flex-col gap-2">
              <Button onClick={openCameraModal} variant="ghost" className="justify-start">
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
              <Button onClick={triggerFileInput} variant="ghost" className="justify-start">
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

export default ScanFab;
