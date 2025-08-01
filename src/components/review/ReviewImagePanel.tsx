import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
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
  const [internalZoom, setInternalZoom] = useState(1.87);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  // Reset pan when image changes
  useEffect(() => {
    setPan({ x: 0, y: 0 });
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
          console.error("[ReviewImagePanel] Error loading image:", error);
          setImgError(true);
          toast.error("Failed to load image", "Image Error");
        })
        .finally(() => setLoading(false));
    } else {
      setSignedUrl(null);
    }
  }, [imagePath]);

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-white rounded-lg h-full">
      {/* Zoom controls - Touch-friendly sizing */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
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
      </div>

      {/* Image container with pan and zoom - Enhanced touch support */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden select-none flex items-center justify-center ${
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
          touchAction: "none", // Prevent default touch actions
          minHeight: "300px",
          userSelect: "none", // Prevent text selection
          WebkitUserSelect: "none", // Safari
        }}
      >
        <div
          className="flex items-center justify-center w-full h-full p-2 sm:p-4"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transition: (draggingRef.current || touchStartRef.current)
              ? "none"
              : "transform 0.1s ease-out",
          }}
        >
          {loading && <div className="text-sm text-gray-500">Loading image...</div>}
          {!loading && signedUrl && !imgError && (
            <img
              ref={imgRef}
              src={signedUrl}
              alt={`Scanned card ${selectedCardId}`}
              draggable={false}
              style={{
                transform: `scale(${internalZoom * externalZoom})`,
                transformOrigin: "center",
                transition: (draggingRef.current || touchStartRef.current) ? "none" : "transform 0.2s",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                margin: "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
                pointerEvents: "none", // Prevent image drag
              }}
              crossOrigin="anonymous"
              onError={() => {
                setImgError(true);
                toast.loadFailed("image");
              }}
            />
          )}
          {!loading && imgError && (
            <div className="text-red-500 text-sm text-center p-4">Failed to load image.</div>
          )}
          {!loading && !signedUrl && !imgError && (
            <div className="text-gray-500 text-sm text-center p-4">No image available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewImagePanel;
