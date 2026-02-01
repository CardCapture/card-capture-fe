import React, { useRef, useState, useCallback, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize2, QrCode } from "lucide-react";
import { toast } from '@/lib/toast';
import { getSignedImageUrl } from "@/lib/imageUtils";

const ReviewImagePanel = ({
  imagePath,
  zoom: externalZoom,
  zoomIn,
  zoomOut,
  selectedCardId,
}: {
  imagePath: string;
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  selectedCardId: string | undefined;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [internalZoom, setInternalZoom] = useState(1.5); // Good readable zoom that's centered
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [rotation, setRotation] = useState(0); // degrees
  const [imageDimensions, setImageDimensions] = useState<{width: number; height: number} | null>(null);

  // Pan and interaction state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  
  // Touch-specific state
  const touchStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const accumulatedMovementRef = useRef(0);
  const isPinchingRef = useRef(false);

  // Mouse pan handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      draggingRef.current = true;
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan]
  );

  const rotateLeft = useCallback(() => setRotation((r) => (r - 90 + 360) % 360), []);
  const rotateRight = useCallback(() => setRotation((r) => (r + 90) % 360), []);

  // Auto-fit function to fit the entire card in view
  const autoFit = useCallback(() => {
    if (!containerRef.current || !imageDimensions) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Account for rotation - swap dimensions if rotated 90 or 270 degrees
    const isRotated = rotation === 90 || rotation === 270;
    const imageWidth = isRotated ? imageDimensions.height : imageDimensions.width;
    const imageHeight = isRotated ? imageDimensions.width : imageDimensions.height;
    
    // Calculate scale to fit with padding
    const padding = 40;
    const scaleX = (containerWidth - padding) / imageWidth;
    const scaleY = (containerHeight - padding) / imageHeight;
    
    // Use the smaller scale to ensure entire image fits
    const fitScale = Math.min(scaleX, scaleY);
    
    // Set zoom to fit the card nicely - at least 1.2x for readability
    const optimalZoom = Math.max(fitScale, 1.2);
    
    setInternalZoom(optimalZoom);
    setPan({ x: 0, y: 0 }); // Center the image
  }, [imageDimensions, rotation]);

  // Persist rotation per card locally so it survives modal close
  useEffect(() => {
    if (!selectedCardId) return;
    const key = `cardRotation:${selectedCardId}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const deg = parseInt(saved, 10);
      if (!Number.isNaN(deg)) setRotation(((deg % 360) + 360) % 360);
    } else {
      setRotation(0);
    }
  }, [selectedCardId]);

  useEffect(() => {
    if (!selectedCardId) return;
    const key = `cardRotation:${selectedCardId}`;
    localStorage.setItem(key, String(rotation));
  }, [rotation, selectedCardId]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    setPan({
      x: startRef.current.panX + dx,
      y: startRef.current.panY + dy,
    });
  }, []);

  const onMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // Touch pan handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - start panning
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX: pan.x,
          panY: pan.y,
        };
        isPinchingRef.current = false;
      } else if (e.touches.length === 2) {
        // Two touches - start pinch zoom
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastDistanceRef.current = distance;
        accumulatedMovementRef.current = 0;
        isPinchingRef.current = true;
        touchStartRef.current = null; // Stop panning during pinch
      }
    },
    [pan]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault(); // Prevent scrolling

      if (e.touches.length === 1 && touchStartRef.current && !isPinchingRef.current) {
        // Single touch - pan the image
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;
        setPan({
          x: touchStartRef.current.panX + dx,
          y: touchStartRef.current.panY + dy,
        });
      } else if (e.touches.length === 2 && lastDistanceRef.current !== null) {
        // Two touches - pinch zoom
        const newDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const delta = newDistance - lastDistanceRef.current;
        accumulatedMovementRef.current += delta;

        // Threshold for zoom operations (reduced for more responsive mobile experience)
        const ZOOM_THRESHOLD = 30;

        if (Math.abs(accumulatedMovementRef.current) > ZOOM_THRESHOLD) {
          if (accumulatedMovementRef.current > 0) {
            zoomIn();
          } else {
            zoomOut();
          }
          // Reset accumulated movement after zoom
          accumulatedMovementRef.current = 0;
          lastDistanceRef.current = newDistance;
        }
      }
    },
    [zoomIn, zoomOut]
  );

  const onTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    lastDistanceRef.current = null;
    accumulatedMovementRef.current = 0;
    isPinchingRef.current = false;
  }, []);

  // Handle wheel zoom (for desktop)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom on trackpad
        const delta = -e.deltaY;
        if (delta > 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      } else {
        // Regular scroll wheel zoom
        const delta = -e.deltaY;
        if (delta > 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    },
    [zoomIn, zoomOut]
  );

  // Legacy touch handlers for wheel events (keeping for compatibility)
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastDistanceRef.current = distance;
      accumulatedMovementRef.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && lastDistanceRef.current !== null) {
        const newDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const delta = newDistance - lastDistanceRef.current;
        accumulatedMovementRef.current += delta;

        const ZOOM_THRESHOLD = 30;

        if (Math.abs(accumulatedMovementRef.current) > ZOOM_THRESHOLD) {
          if (accumulatedMovementRef.current > 0) {
            zoomIn();
          } else {
            zoomOut();
          }
          accumulatedMovementRef.current = 0;
          lastDistanceRef.current = newDistance;
        }
      }
    },
    [zoomIn, zoomOut]
  );

  const handleTouchEnd = useCallback(() => {
    lastDistanceRef.current = null;
    accumulatedMovementRef.current = 0;
  }, []);

  // Reset pan when image changes, keep zoom at default
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setImageDimensions(null); // Reset dimensions for new image
    setInternalZoom(1.5); // Keep at readable zoom that's centered
  }, [selectedCardId]);

  // Add event listeners
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    // Desktop events
    containerEl.addEventListener("wheel", handleWheel, { passive: false });
    
    // Legacy touch events (for compatibility)
    containerEl.addEventListener("touchstart", handleTouchStart, { passive: false });
    containerEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    containerEl.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      containerEl.removeEventListener("wheel", handleWheel);
      containerEl.removeEventListener("touchstart", handleTouchStart);
      containerEl.removeEventListener("touchmove", handleTouchMove);
      containerEl.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Load image
  useEffect(() => {
    if (imagePath) {
      setLoading(true);
      setImgError(false);
      getSignedImageUrl(imagePath)
        .then((url) => {
          if (!url) {
            setImgError(true);
            toast.error("Failed to load image", "Image Error");
          } else {
            setSignedUrl(url);
          }
        })
        .catch((error) => {
          logger.error("[ReviewImagePanel] Error loading image:", error);
          setImgError(true);
          toast.error("Failed to load image", "Image Error");
        })
        .finally(() => setLoading(false));
    } else {
      setSignedUrl(null);
    }
  }, [imagePath]);

  // Just store the image dimensions when loaded, no auto-adjustments
  // The user can use the auto-fit button if they want optimal view

  // Handle image load to get natural dimensions
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-white rounded-lg">
      {/* Zoom/Rotate controls - Touch-friendly sizing */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button 
          size="icon" 
          variant="outline" 
          onClick={autoFit} 
          className="h-10 w-10 sm:h-8 sm:w-8 touch-manipulation"
          title="Auto-fit"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          onClick={zoomOut} 
          className="h-10 w-10 sm:h-8 sm:w-8 touch-manipulation"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          onClick={zoomIn} 
          className="h-10 w-10 sm:h-8 sm:w-8 touch-manipulation"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={rotateLeft}
          className="h-10 w-10 sm:h-8 sm:w-8 touch-manipulation"
          title="Rotate left"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={rotateRight}
          className="h-10 w-10 sm:h-8 sm:w-8 touch-manipulation"
          title="Rotate right"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Image container with pan and zoom - Enhanced touch support */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden select-none ${
          draggingRef.current || touchStartRef.current ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          touchAction: "pan-y pinch-zoom", // Allow vertical scrolling, prevent conflicts
          minHeight: "300px",
          userSelect: "none", // Prevent text selection
          WebkitUserSelect: "none", // Safari
          position: "relative",
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading image...</div>
          </div>
        )}
        {!loading && signedUrl && !imgError && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${internalZoom * externalZoom})`,
              transformOrigin: "center",
              transition: (draggingRef.current || touchStartRef.current) ? "none" : "transform 0.2s",
              touchAction: "none", // Prevent touch conflicts on image manipulation area
            }}
          >
            <img
              ref={imgRef}
              src={signedUrl}
              alt={`Scanned card ${selectedCardId}`}
              draggable={false}
              style={{
                display: "block",
                userSelect: "none",
                WebkitUserSelect: "none",
                pointerEvents: "none", // Prevent image drag
              }}
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              onError={() => {
                setImgError(true);
                toast.loadFailed("image");
              }}
            />
          </div>
        )}
        {!loading && imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-500 text-sm text-center p-4">Failed to load image.</div>
          </div>
        )}
        {!loading && !signedUrl && !imgError && (
          <div
            className="absolute inset-0 flex items-center justify-center p-8"
            style={{
              animation: "fadeInUp 200ms ease-out",
            }}
          >
            <style>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            <div className="w-full max-w-md bg-white rounded-lg p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icon chip with presence badge */}
                <div className="relative">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>

                {/* Copy */}
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-gray-900">QR code scan</h3>
                  <p className="text-sm text-gray-600">
                    Student info was captured with a QR code, so no image is available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewImagePanel;
