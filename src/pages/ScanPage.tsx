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
import { Camera, X, Calendar, AlertCircle, Upload, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useEvents } from '@/hooks/useEvents';
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';
import { useCardUpload } from '@/hooks/useCardUpload';
import { Event } from '@/types/event';

const ScanPage: React.FC = () => {
  const { events, fetchEvents } = useEvents();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [useFileInput, setUseFileInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const capturedFileRef = React.useRef<File | null>(null);
  const { uploadCard } = useCardUpload();

  // Detect device type on mount
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /Android/.test(userAgent);
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isChromeBrowser = /Chrome/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsSafari(isSafariBrowser);
    setIsChrome(isChromeBrowser);
    
    // On iOS, prefer file input approach
    if (isIOSDevice) {
      setUseFileInput(true);
    }
  }, []);

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

  // Initialize camera when isCameraOpen changes
  useEffect(() => {
    console.log('Camera effect triggered, isCameraOpen:', isCameraOpen, 'useFileInput:', useFileInput);
    
    // Skip camera initialization if using file input
    if (useFileInput) {
      console.log('Using file input, skipping camera initialization');
      return;
    }
    
    // Skip if camera is not supposed to be open
    if (!isCameraOpen) {
      console.log('Camera is not open, skipping initialization');
      // Only stop tracks if we have an active stream
      if (stream) {
        console.log('Stopping existing camera tracks');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }
    
    // Camera should be open, initialize it
    console.log('Initializing camera...');
    setCameraError(null);
    
    // Check if we're on HTTPS or localhost
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('192.168.');
    
    if (!isSecureContext && !isLocalhost) {
      const error = "Camera access requires HTTPS. Please use HTTPS or localhost.";
      console.error(error);
      setCameraError(error);
      toast.error(error, "Camera Error");
      return;
    }
    
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      let error = "Camera API not available in this browser";
      
      // Provide more specific guidance for iOS
      if (isIOS) {
        if (isChrome) {
          error = "On iOS, Chrome uses Safari's engine. Please use Safari instead.";
        } else if (!isSafari) {
          error = "On iOS, camera access is only available in Safari.";
        }
      }
      
      console.error(error);
      setCameraError(error);
      toast.error(error, "Camera Error");
      return;
    }
    
    // Simple constraints that work on most devices
    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };
    
    console.log('Using constraints:', constraints);
    
    // Request camera access
    navigator.mediaDevices.getUserMedia(constraints)
      .then(mediaStream => {
        console.log('Camera access granted');
        
        // Set the stream in state
        setStream(mediaStream);
        
        // Wait for the next render cycle to ensure the video element exists
        setTimeout(() => {
          const videoElement = videoRef.current;
          if (!videoElement) {
            console.error('Video element not found after timeout');
            return;
          }
          
          console.log('Setting video source and starting playback');
          videoElement.srcObject = mediaStream;
          
          // Use a more robust approach to start video playback
          const playPromise = videoElement.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Video playback started successfully');
              })
              .catch(e => {
                console.error("Video play error:", e);
                setCameraError(`Could not start video playback: ${e.message}`);
                toast.error(`Could not start video playback: ${e.message}`, "Video Playback Error");
              });
          }
        }, 100);
      })
      .catch(error => {
        console.error("Error accessing camera:", error);
        
        let errorMessage = `Camera error: ${error.name} - ${error.message}`;
        
        // Provide more specific guidance for common errors
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access was denied. Please allow camera access in your browser settings.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on your device.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera is in use by another application.";
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = "Camera does not meet the required constraints.";
        } else if (error.name === 'TypeError') {
          errorMessage = "Invalid camera constraints.";
        }
        
        setCameraError(errorMessage);
        toast.error(errorMessage, "Camera Error");
      });
      
    // Cleanup function
    return () => {
      console.log('Camera effect cleanup running');
      // We don't stop tracks here to prevent the camera from being turned off
      // when the effect re-runs due to dependency changes
    };
  }, [isCameraOpen, useFileInput, isIOS, isChrome, isSafari]);

  // Separate effect for cleanup when component unmounts
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up camera');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  // Open camera view
  const openCamera = () => {
    console.log('openCamera called');
    
    // If using file input, trigger it immediately without changing UI state
    if (useFileInput && fileInputRef.current) {
      console.log('Using file input, triggering file input click');
      fileInputRef.current.click();
      return;
    }
    
    // Otherwise, open the camera UI
    console.log('Setting isCameraOpen to true');
    setIsCameraOpen(true);
  };

  // Close camera view
  const closeCamera = () => {
    console.log('closeCamera called');
    setIsCameraOpen(false);
    setCapturedImage(null);
    
    // Stop all tracks when closing camera
    if (stream) {
      console.log('Stopping camera tracks in closeCamera');
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      capturedFileRef.current = file; // Store the file reference
      setCapturedImage(URL.createObjectURL(file)); // Use URL.createObjectURL for better memory management
    }
  };

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
        
        // If using file input, reset it for next photo
        if (useFileInput && fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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

  // Take snapshot from video stream
  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current video frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob and create a file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
            capturedFileRef.current = file; // Store the file reference
            setCapturedImage(URL.createObjectURL(blob)); // Use URL.createObjectURL for better memory management
          }
        }, 'image/png');
      }
    }
  };

  // Select an event
  const handleEventChange = (id: string) => {
    const event = events.find(evt => evt.id === id);
    if (event) {
      setSelectedEventId(id);
      setSelectedEvent(event);
      localStorage.setItem("lastEventId", id);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    if (useFileInput && fileInputRef.current) {
      fileInputRef.current.value = '';
      // Trigger the file input again
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    }
  };

  // Function to manually process the captured image
  const handleProcessImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Process Image button clicked");
    
    if (!selectedEventId) {
      console.error("No event selected for processing");
      toast.error("Please select an event first", "Error");
      return;
    }
    
    if (!capturedFileRef.current) {
      console.error("No captured file found in ref");
      toast.error("No image to process", "Error");
      return;
    }

    console.log("Starting image processing with:", {
      eventId: selectedEventId,
      file: {
        name: capturedFileRef.current.name,
        type: capturedFileRef.current.type,
        size: capturedFileRef.current.size
      }
    });

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      await processImage(capturedFileRef.current);
    } catch (error) {
      console.error("Failed to process image:", error);
      toast.error("Failed to process image", "Error");
    }
  };

  // If camera is open, render the camera view
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* Hidden file input for iOS */}
        {useFileInput && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,image/*"
            className="hidden"
          />
        )}
        
        {/* Back button in top-left corner */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-black/80"
          onClick={() => {
            closeCamera();
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
        
        {/* Camera preview or captured image */}
        <div className="flex-1 relative overflow-hidden">
          {capturedImage ? (
            <div className="relative w-full h-full">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
              {/* Mobile-optimized action buttons */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <Button 
                  onClick={retakePhoto} 
                  variant="outline" 
                  size="lg"
                  className="w-full sm:w-auto bg-white/90 backdrop-blur-sm hover:bg-white"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Retake
                </Button>
                <Button 
                  onClick={handleProcessImage} 
                  size="lg" 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  disabled={!selectedEventId}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Process Image
                </Button>
              </div>
            </div>
          ) : cameraError ? (
            <div className="w-full h-full flex items-center justify-center text-white p-4">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <p className="mb-4 text-sm sm:text-base">{cameraError}</p>
                {isIOS && isChrome && (
                  <div className="mb-4 p-3 bg-yellow-900/50 rounded-lg text-xs sm:text-sm">
                    <p className="font-bold mb-1">iOS Chrome Limitation:</p>
                    <p>On iOS, Chrome uses Safari's engine and has limited camera access.</p>
                    <p className="mt-2">Please use Safari instead.</p>
                  </div>
                )}
                <Button onClick={closeCamera} className="w-full sm:w-auto">
                  Go Back
                </Button>
              </div>
            </div>
          ) : useFileInput ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white p-4">
              <div className="text-center max-w-md">
                <Upload className="h-16 w-16 mx-auto mb-4" />
                <p className="mb-4 text-sm sm:text-base">Waiting for photo...</p>
                <p className="text-xs sm:text-sm text-gray-400 mb-4">
                  If the camera doesn't open automatically, tap below
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  Open Camera
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}
          
          {/* Capture button - mobile optimized */}
          {!cameraError && !useFileInput && !capturedImage && (
            <div className="absolute bottom-6 left-4 right-4 flex justify-center">
              <Button 
                variant="default" 
                size="lg"
                className="rounded-full px-8 py-4 text-lg font-semibold bg-white text-black hover:bg-gray-100 min-h-[56px] min-w-[120px]"
                onClick={takeSnapshot}
                disabled={!selectedEventId}
              >
                Take Photo
              </Button>
            </div>
          )}
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
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Camera Error Display */}
        {cameraError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2 text-red-700">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Camera/Upload UI */}
        {!capturedImage && !isCameraOpen && (
          <div className="space-y-4">
            {!useFileInput && (
              <Button
                onClick={openCamera}
                className="w-full min-h-[48px] text-base"
                disabled={!selectedEventId}
                size="lg"
              >
                <Camera className="mr-2 h-5 w-5" />
                Open Camera
              </Button>
            )}
            {useFileInput && (
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/*"
                className="hidden"
              />
            )}
            
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
              <Button
                onClick={handleProcessImage}
                disabled={isProcessing}
                className="w-full sm:w-auto min-h-[44px]"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process Image
                  </>
                )}
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
    </div>
  );
};

export default ScanPage; 