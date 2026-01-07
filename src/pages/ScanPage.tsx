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
import { ScanStatusCard } from '@/components/ScanStatusCard';
import imageCompression from 'browser-image-compression';
import { OfflineBanner } from '@/components/OfflineBanner';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';

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
  const { uploadCard, isOnline } = useCardUpload();
  const [forceShowProcessing, setForceShowProcessing] = useState(false);

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

  // Utility to resize an image file or dataUrl to max 2048px and JPEG quality 0.85
  async function resizeImage(fileOrDataUrl: File | string): Promise<File> {
    let file: File;
    let originalSize = 0;
    let originalWidth = 0;
    let originalHeight = 0;
    if (typeof fileOrDataUrl === 'string') {
      // Convert dataUrl to File
      const res = await fetch(fileOrDataUrl);
      const blob = await res.blob();
      file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      originalSize = blob.size;
      // Get dimensions
      const img = new window.Image();
      img.src = fileOrDataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      originalWidth = img.width;
      originalHeight = img.height;
    } else {
      file = fileOrDataUrl;
      originalSize = file.size;
      // Get dimensions
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => { img.onload = resolve; });
      originalWidth = img.width;
      originalHeight = img.height;
    }
    console.log('Original file size (MB):', (originalSize / 1024 / 1024).toFixed(2));
    console.log('Original image dimensions:', originalWidth + 'x' + originalHeight);
    const options = {
      maxWidthOrHeight: 2048,
      initialQuality: 0.85,
      useWebWorker: true,
    };
    const resizedFile = await imageCompression(file, options);
    // Get resized dimensions
    const resizedImg = new window.Image();
    resizedImg.src = URL.createObjectURL(resizedFile);
    await new Promise((resolve) => { resizedImg.onload = resolve; });
    console.log('Resized file size (MB):', (resizedFile.size / 1024 / 1024).toFixed(2));
    console.log('Resized image dimensions:', resizedImg.width + 'x' + resizedImg.height);
    return resizedFile;
  }

  // Process the captured image
  const processImage = async (file: File) => {
    console.log('Uploading file:', file.name, 'size (MB):', (file.size / 1024 / 1024).toFixed(2));

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

    try {
      // Use the uploadCard hook (with event name for offline queue)
      const data = await uploadCard(file, selectedEventId, selectedEvent.school_id, selectedEvent.name);

      if (data.queued) {
        // Card was queued for offline sync
        setForceShowProcessing(false);
      } else {
        setDocumentId(data.document_id || null);
        setForceShowProcessing(true); // Force show processing status
        toast.success("Card captured successfully. Processing in background...");

        // Reset force show processing after a delay to allow natural processing status to take over
        setTimeout(() => setForceShowProcessing(false), 3000);
      }
    } catch (error: any) {
      console.error("Upload error details:", {
        error,
        message: error.message,
        stack: error.stack
      });
      toast.error("Failed to process card. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle image captured from CameraCapture component
  const handleImageCaptured = async (imageDataUrl: string) => {
    // Resize the image before upload
    const resizedFile = await resizeImage(imageDataUrl);
    console.log('Resized file size (MB):', (resizedFile.size / 1024 / 1024).toFixed(2));
    setIsCameraOpen(false); // Close camera after capture
    processImage(resizedFile);
  };

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Resize the image before upload
      const resizedFile = await resizeImage(file);
      console.log('Resized file size (MB):', (resizedFile.size / 1024 / 1024).toFixed(2));
      setCapturedImage(URL.createObjectURL(resizedFile));
      processImage(resizedFile);
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">Scan Card</h1>
          <SyncStatusBadge />
        </div>

        {/* Offline Banner */}
        <OfflineBanner className="mb-4" />

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
              {events.filter(event => event.status !== "archived").map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scan Status Card - Show if event is selected */}
        {selectedEventId && selectedEvent && (
          <ScanStatusCard
            eventId={selectedEventId}
            eventName={selectedEvent.name}
            className="mb-6"
            forceShow={forceShowProcessing}
          />
        )}

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