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
  const [internalZoom, setInternalZoom] = useState(1.875);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Add pan state and drag tracking
  const [pan, setPan] = useState({ x: 150, y: 150 });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const lastDistanceRef = useRef<number | null>(null);

  // Add a ref to track accumulated movement
  const accumulatedMovementRef = useRef(0);

  // Pan handlers
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

  // Handle wheel zoom
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

  // Handle touch events for pinch zoom
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastDistanceRef.current = distance;
      accumulatedMovementRef.current = 0; // Reset accumulated movement
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

        // Accumulate the movement
        accumulatedMovementRef.current += delta;

        // Much higher threshold for zoom operations
        const ZOOM_THRESHOLD = 50; // Significantly increased threshold
        const SCALE_FACTOR = 0.2; // Much smaller scale factor for more gradual zoom

        if (Math.abs(accumulatedMovementRef.current) > ZOOM_THRESHOLD) {
          if (accumulatedMovementRef.current > 0) {
            // Zoom in
            zoomIn();
            // Reset accumulated movement after zoom
            accumulatedMovementRef.current = 0;
            lastDistanceRef.current = newDistance;
          } else {
            // Zoom out
            zoomOut();
            // Reset accumulated movement after zoom
            accumulatedMovementRef.current = 0;
            lastDistanceRef.current = newDistance;
          }
        }
      }
    },
    [zoomIn, zoomOut]
  );

  const handleTouchEnd = useCallback(() => {
    lastDistanceRef.current = null;
    accumulatedMovementRef.current = 0; // Reset accumulated movement
  }, []);

  // Reset pan when image changes
  useEffect(() => {
    // Set default position down and to the right for better centering
    setPan({ x: 150, y: 150 });
  }, [selectedCardId]);

  // Add event listeners
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    containerEl.addEventListener("wheel", handleWheel, { passive: false });
    containerEl.addEventListener("touchstart", handleTouchStart);
    containerEl.addEventListener("touchmove", handleTouchMove);
    containerEl.addEventListener("touchend", handleTouchEnd);

    return () => {
      containerEl.removeEventListener("wheel", handleWheel);
      containerEl.removeEventListener("touchstart", handleTouchStart);
      containerEl.removeEventListener("touchmove", handleTouchMove);
      containerEl.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    if (imagePath) {
      setLoading(true);
      setImgError(false);
      getSignedImageUrl(imagePath)
        .then((url) => setSignedUrl(url))
        .catch(() => setSignedUrl(null))
        .finally(() => setLoading(false));
    } else {
      setSignedUrl(null);
    }
  }, [imagePath]);

  // Debug log for imageUrl
  console.log("ReviewImagePanel: Rendering img with imageUrl:", imagePath);

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-white rounded-lg h-full">
      {/* Zoom controls - position absolutely in top right */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button size="icon" variant="outline" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Image container with pan and zoom */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden ${
          draggingRef.current ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          touchAction: "none", // Prevent default touch actions to enable custom handling
          minHeight: "500px", // Ensure minimum height
        }}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transition: draggingRef.current
              ? "none"
              : "transform 0.1s ease-out",
          }}
        >
          {loading && <div>Loading image...</div>}
          {!loading && signedUrl && !imgError && (
            <img
              ref={imgRef}
              src={signedUrl}
              alt={`Scanned card ${selectedCardId}`}
              draggable={false}
              style={{
                transform: `scale(${internalZoom * externalZoom})`,
                transformOrigin: "center",
                transition: draggingRef.current ? "none" : "transform 0.2s",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                margin: "auto",
              }}
              crossOrigin="anonymous"
              onError={() => {
                setImgError(true);
                toast.loadFailed("image");
              }}
            />
          )}
          {!loading && imgError && (
            <div style={{ color: "red" }}>Failed to load image.</div>
          )}
          {!loading && !signedUrl && !imgError && (
            <div>No image available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewImagePanel;
