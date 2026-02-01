import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, X, Keyboard, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { StudentService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onSuccess?: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onSuccess,
}) => {
  logger.log('QRScannerModal rendering, isOpen:', isOpen);

  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualToken, setManualToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const { session } = useAuth();
  const { toast } = useToast();

  // Process scanned or manually entered token
  const processToken = async (token: string) => {
    if (!token || token.trim().length === 0) {
      setError('Invalid token');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      // Check for invalid formats
      if (token.startsWith('data:') || token.includes('base64,')) {
        throw new Error('Invalid code format. Please scan the QR code, not paste the image.');
      }

      const response = await StudentService.scanStudent(
        token.trim(),
        eventId,
        undefined,
        undefined,
        session?.access_token || undefined
      );

      setSuccess(true);
      toast({
        title: 'Success!',
        description: 'Student information has been added to the event.',
      });

      // Auto-close after success
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to process token. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Scan failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Stop scanner and clean up resources
  const stopScanner = () => {
    // Stop the video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset reader
    if (readerRef.current) {
      readerRef.current = null;
    }

    setIsScanning(false);
    isScanningRef.current = false;
    setIsInitializing(false);
  };

  // Start the QR scanner
  const startScanner = async () => {
    logger.log('startScanner called, videoRef.current:', videoRef.current);
    if (!videoRef.current) {
      logger.log('No video ref, returning');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      logger.log('Stopping any existing scanner...');
      // Stop any existing scanner first
      stopScanner();

      logger.log('Creating BrowserMultiFormatReader...');
      // Create reader instance
      readerRef.current = new BrowserMultiFormatReader();

      logger.log('Getting video devices...');
      // Get video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      logger.log('Video devices found:', videoDevices.length);

      if (videoDevices.length === 0) {
        throw new Error('No cameras found. Please ensure camera access is granted.');
      }

      // Prefer back camera
      const backCamera = videoDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear')
      );
      const selectedDeviceId = backCamera?.deviceId || videoDevices[0].deviceId;
      logger.log('Selected device:', selectedDeviceId);

      logger.log('Getting user media...');
      // Get video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          facingMode: { ideal: 'environment' }
        }
      });

      logger.log('Got stream:', stream);
      streamRef.current = stream;

      if (videoRef.current) {
        logger.log('Setting video source...');
        videoRef.current.srcObject = stream;

        try {
          await videoRef.current.play();
          logger.log('Video playing, setting scanning state...');
        } catch (playErr) {
          logger.error('Error playing video:', playErr);
        }

        setIsScanning(true);
        isScanningRef.current = true;
        setIsInitializing(false);

        // Start continuous scanning after a brief delay to ensure video is ready
        setTimeout(() => {
          logger.log('Starting continuous scanning...');
          startContinuousScanning();
        }, 500);
      }
    } catch (err: any) {
      logger.error('Failed to start scanner:', err);
      setError(err.message || 'Failed to initialize camera. Please check permissions.');
      setIsInitializing(false);
      setIsScanning(false);
    }
  };

  // Continuous scanning loop
  const startContinuousScanning = () => {
    logger.log('startContinuousScanning called');
    if (!videoRef.current || !readerRef.current) {
      logger.log('Missing video or reader ref, cannot scan');
      return;
    }

    const scanFrame = async () => {
      if (!videoRef.current || !readerRef.current || !isScanningRef.current) {
        logger.log('Scanning stopped or refs missing');
        return;
      }

      try {
        logger.log('Attempting to decode frame...');
        const result = await readerRef.current.decodeOnce(videoRef.current);

        if (result) {
          logger.log('QR code detected:', result.getText());
          // Stop scanning before processing
          stopScanner();
          await processToken(result.getText());
          return;
        }
      } catch (err) {
        // No QR code found in this frame - continue scanning
      }

      // Continue scanning if still active
      if (isScanningRef.current) {
        requestAnimationFrame(scanFrame);
      }
    };

    // Start the scanning loop
    logger.log('Starting scan loop...');
    requestAnimationFrame(scanFrame);
  };

  // Effect to manage scanner lifecycle
  useEffect(() => {
    logger.log('QRScannerModal useEffect - isOpen:', isOpen, 'mode:', mode);

    if (!isOpen) {
      stopScanner();
      setMode('scan');
      setError(null);
      setSuccess(false);
      return;
    }

    if (isOpen && mode === 'scan') {
      logger.log('Starting scanner...');
      // Wait for next tick to ensure video element is rendered
      const timer = setTimeout(() => {
        logger.log('Starting scanner after timeout...');
        startScanner();
      }, 100);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else if (mode === 'manual') {
      stopScanner();
    }

    // Cleanup on unmount or close
    return () => {
      stopScanner();
    };
  }, [isOpen, mode]);

  const handleManualSubmit = async () => {
    await processToken(manualToken);
  };

  const handleClose = () => {
    stopScanner();
    setMode('scan');
    setManualToken('');
    setError(null);
    setSuccess(false);
    setIsProcessing(false);
    onClose();
  };

  const switchToManual = () => {
    stopScanner();
    setMode('manual');
    setError(null);
  };

  const switchToScan = () => {
    setMode('scan');
    setManualToken('');
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Scan Student QR Code
          </DialogTitle>
          <DialogDescription>
            Scan a student's QR code to quickly add their information to this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <Button
              variant={mode === 'scan' ? 'default' : 'ghost'}
              size="sm"
              onClick={switchToScan}
              disabled={isProcessing}
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'ghost'}
              size="sm"
              onClick={switchToManual}
              disabled={isProcessing}
              className="flex-1"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Enter Code
            </Button>
          </div>

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Student successfully added to event!
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Scanner or Manual Input */}
          {mode === 'scan' ? (
            <div className="space-y-4">
              {/* Video Container */}
              <div className="relative w-full h-[300px] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {isInitializing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Initializing camera...</p>
                    </div>
                  </div>
                )}
                {isScanning && !isInitializing && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white rounded-lg opacity-50" />
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="text-center text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Processing student information...
                </div>
              )}

              {isScanning && !isProcessing && (
                <div className="text-center text-sm text-gray-500">
                  Position the QR code within the frame to scan
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Enter student token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isProcessing && manualToken) {
                    handleManualSubmit();
                  }
                }}
                disabled={isProcessing}
                autoFocus
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!manualToken || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Add Student'
                )}
              </Button>
            </div>
          )}

          {/* Close Button */}
          {!isProcessing && !success && (
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};