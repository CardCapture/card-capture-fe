import { useState, useRef, useEffect } from "react";
import { Plus, Camera, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/lib/toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CardScanner from "@/components/CardScanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEvents } from "@/hooks/useEvents";
import { IntegrationsService } from "@/services/IntegrationsService";
import { CardService } from "@/services/CardService";

// Helper function
const dataURLtoFile = (dataurl: string, filename: string): File | null => {
  const arr = dataurl.split(",");
  if (!arr[0] || !arr[1]) return null;
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  const mime = mimeMatch[1];
  try {
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    console.error("Error converting data URL:", e);
    return null;
  }
};

// No props needed from parent for this version
interface ScanFabProps {
  onUploadRequested?: (file: File) => Promise<void>;
  isUploadInProgress?: boolean;
  uploadProgress?: number;
}

const ScanFab = ({
  onUploadRequested,
  isUploadInProgress = false,
  uploadProgress: parentUploadProgress,
}: ScanFabProps) => {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localUploadProgress, setLocalUploadProgress] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { events, loading: eventsLoading, fetchEvents } = useEvents();

  // Use parent progress if provided, otherwise use local progress
  const effectiveProgress =
    typeof parentUploadProgress === "number"
      ? parentUploadProgress
      : localUploadProgress;

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
    console.log("File selected:", file);
    if (file) {
      console.log("Selected event ID:", selectedEventId);
      if (!selectedEventId) {
        toast.required("Event selection");
        return;
      }
      setShowUploadDialog(false);
      startProcessing(file);
    }
    if (event.target) event.target.value = "";
  };

  const openCameraModal = () => {
    setIsCameraModalOpen(true);
    setIsPopoverOpen(false);
  };

  const startProcessing = async (file: File | null) => {
    console.log("Starting processing with file:", file);
    console.log("Selected event ID:", selectedEventId);

    if (!file) {
      toast.error("No valid file provided.", "File Error");
      return;
    }

    if (!selectedEventId) {
      toast.required("Event selection");
      return;
    }

    setIsUploading(true);
    setLocalUploadProgress(10);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("event_id", selectedEventId);
    // Add school_id if available (optional, adjust as needed)
    // formData.append("school_id", selectedSchoolId);
    console.log("FormData created:", {
      file: file.name,
      event_id: selectedEventId,
    });
    const timer = setTimeout(
      () => setLocalUploadProgress(50 + Math.random() * 20),
      600
    );

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      let endpoint = "/upload";
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        endpoint = "/upload";
      }
      console.log("Making upload request to:", `${apiBaseUrl}${endpoint}`);

      // Convert FormData to a simple object for CardService
      const cardData: Record<string, string> = {};
      formData.forEach((value, key) => {
        if (typeof value === "string") {
          cardData[key] = value;
        }
      });

      // For now, use manual upload. TODO: Update CardService to handle file uploads
      await CardService.uploadCardManually(cardData);

      const data = { jobs_created: 1 }; // Mock response
      setLocalUploadProgress(100);

      if (endpoint === "/upload") {
        toast.success(
          `Bulk upload successful. ${data.jobs_created} cards queued.`
        );
      } else {
        toast.success("Card uploaded successfully");
      }

      setTimeout(() => {
        setIsUploading(false);
        setLocalUploadProgress(0);
      }, 1500);
    } catch (error: unknown) {
      console.error("Upload failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during upload.";
      toast.error(errorMessage, "Upload Failed");
      setIsUploading(false);
      setLocalUploadProgress(0);
    }
  };

  const handleImageCaptured = (imageDataUrl: string) => {
    setIsCameraModalOpen(false);
    const capturedFile = dataURLtoFile(
      imageDataUrl,
      `capture-${Date.now()}.png`
    );
    startProcessing(capturedFile);
  };

  const testBackendConnection = async () => {
    try {
      console.log(
        "ScanFab: Testing backend connection via IntegrationsService"
      );

      await IntegrationsService.testConnection();

      console.log("ScanFab: Test connection successful");

      toast.success(
        "Backend connection test completed successfully.",
        "Connection Successful"
      );
    } catch (error: unknown) {
      console.error("ScanFab: Test connection failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to connect to the backend server. Please check your connection.";
      toast.error(errorMessage, "Connection Failed");
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
                {events.filter(event => event.status !== "archived").map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} ({new Date(event.date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CardScanner
              onImageCaptured={handleImageCaptured}
              onScanComplete={() => setIsCameraModalOpen(false)}
            />
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
                {events.filter(event => event.status !== "archived").map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} ({new Date(event.date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => fileInputRef.current?.click()}>
              Upload Image or PDF
            </Button>
            <span className="text-xs text-muted-foreground">
              Accepted file types: Images (JPG, PNG, etc.) or PDF (one or more
              cards)
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,image/*"
        className="hidden"
      />

      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-4">
        {isUploading && (
          <div className="bg-white rounded-lg shadow-lg p-4 w-64">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-gray-500">
                {Math.round(effectiveProgress)}%
              </span>
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
              <Button
                onClick={openCameraModal}
                variant="ghost"
                className="justify-start"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
              <Button
                onClick={triggerFileInput}
                variant="ghost"
                className="justify-start"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};

export default ScanFab;
