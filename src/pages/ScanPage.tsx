import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Camera, X, Calendar, AlertCircle, Upload, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useEvents } from '@/hooks/useEvents';
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';
import { useCardUpload } from '@/hooks/useCardUpload';
import { Event } from '@/types/event';
import { CreateEventModal } from '@/components/CreateEventModal';
import CameraCapture from '@/components/card-scanner/CameraCapture';

const ScanPage: React.FC = () => {
  const { events, fetchEvents } = useEvents();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { uploadCard } = useCardUpload();

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Load last selected event from localStorage when camera opens
  useEffect(() => {
    if (isCameraOpen) {
      const lastEventId = localStorage.getItem("lastEventId");
      if (lastEventId) {
        const event = events.find(evt => evt.id === lastEventId);
        if (event) {
          setSelectedEventId(lastEventId);
          setSelectedEvent(event);
        }
      }
    }
  }, [isCameraOpen, events]);

  // Process the captured image
  const processImage = async (file: File) => {
    console.log('processImage called with file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    if (!selectedEventId) {
      console.error('No event selected');
      return;
    }

    // Find the selected event object to get school_id
    const selectedEvent = events.find(evt => evt.id === selectedEventId);
    if (!selectedEvent) {
      console.error('Selected event not found');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev < 90) {
            return prev + Math.random() * 10;
          }
          return prev;
        });
      }, 500);

      // Use the uploadCard hook
      const data = await uploadCard(file, selectedEventId, selectedEvent.school_id);

      clearInterval(progressInterval);

      setDocumentId(data.document_id);
      setProcessingProgress(100);

      // Reset the camera state and prepare for next photo
      setTimeout(() => {
        setCapturedImage(null);
        setIsProcessing(false);
        setProcessingProgress(0);
      }, 1500);

    } catch (error: any) {
      console.error("Upload error details:", {
        error,
        message: error.message,
        stack: error.stack
      });
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Handle image captured from CameraCapture component
  const handleImageCaptured = (imageDataUrl: string) => {
    // Convert base64 to File object
    const byteString = atob(imageDataUrl.split(',')[1]);
    const mimeString = imageDataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: mimeString });
    
    setCapturedImage(imageDataUrl);
    processImage(file);
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCapturedImage(URL.createObjectURL(file));
      processImage(file);
    }
    if (event.target) event.target.value = '';
  };

  // Select an event
  const handleEventChange = (id: string) => {
    if (id === "create-new") {
      setIsCreateEventModalOpen(true);
      return;
    }
    
    const event = events.find(evt => evt.id === id);
    setSelectedEventId(id);
    setSelectedEvent(event || null);
    localStorage.setItem("lastEventId", id);
  };

  const handleEventCreated = () => {
    fetchEvents(); // Refresh the events list
    setIsCreateEventModalOpen(false);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCameraOpen(true);
  };

  // If camera is open, render the camera view
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* Back button in top-left corner */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-black/80"
          onClick={() => {
            setIsCameraOpen(false);
            navigate('/scan');
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {/* Event selector in top-right corner - responsive */}
        <div className="absolute top-4 right-4 z-10">
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[160px] sm:w-[200px] bg-black/70 backdrop-blur-sm text-white border-white/20 text-xs sm:text-sm">
              <SelectValue placeholder="Select event">
                {selectedEvent ? (
                  <span className="truncate">{selectedEvent.name}</span>
                ) : (
                  "Select event"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Camera Capture Component */}
        <div className="flex-1 flex items-center justify-center p-4">
          <CameraCapture
            onCapture={handleImageCaptured}
            onCancel={() => {
              setIsCameraOpen(false);
              navigate('/scan');
            }}
          />
        </div>
      </div>
    );
  }

  // Otherwise, render the landing view
  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Scan Card</h1>
        
        {/* Event Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Event
          </label>
          <Select
            value={selectedEventId}
            onValueChange={handleEventChange}
          >
            <SelectTrigger className="w-full bg-white border-gray-200 min-h-[44px]">
              <SelectValue placeholder="Choose an event to scan cards for">
                {selectedEvent ? selectedEvent.name : "Choose an event to scan cards for"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create-new" className="text-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Event
                </div>
              </SelectItem>
              {events.length > 0 && (
                <div className="border-t border-gray-200 my-1" />
              )}
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Camera/Upload UI */}
        {!capturedImage && !isCameraOpen && (
          <div className="space-y-4">
            <Button
              onClick={() => setIsCameraOpen(true)}
              className="w-full min-h-[48px] text-base"
              disabled={!selectedEventId}
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              Open Camera
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,image/*"
              className="hidden"
            />
            
            {!selectedEventId && (
              <p className="text-sm text-gray-500 text-center">
                Please select an event first
              </p>
            )}
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full rounded-lg shadow-lg"
              />
              {selectedEvent && (
                <Badge
                  className="absolute top-2 right-2"
                  variant="secondary"
                >
                  <Calendar className="mr-1 h-4 w-4" />
                  {selectedEvent.name}
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button 
                onClick={retakePhoto} 
                variant="secondary"
                className="w-full sm:w-auto min-h-[44px]"
                size="lg"
              >
                <Camera className="mr-2 h-4 w-4" />
                Retake
              </Button>
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={processingProgress} />
                <p className="text-sm text-center text-gray-500">
                  Processing image... {processingProgress}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};

export default ScanPage; 