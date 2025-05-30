import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "@/lib/toast";
import { getSignedImageUrl } from "@/lib/imageUtils";
import { authFetch } from "@/lib/authFetch";

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
  const [isProcessing, setIsProcessing] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  // Pan and interaction state
  const [pan, setPan] = useState({ x: 150, y: 150 });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Touch-specific state
  const touchStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const accumulatedMovementRef = useRef(0);
  const isPinchingRef = useRef(false);

  // Check job status
  const checkJobStatus = useCallback(async () => {
    if (!selectedCardId) return;

    try {
      const response = await authFetch(
        `${apiBaseUrl}/api/uploads/upload-status/${selectedCardId}`
      );
      const data = await response.json();

      if (data.status === "complete") {
        setIsProcessing(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      } else if (data.status === "error") {
        setIsProcessing(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        toast.error("Failed to process image", "Processing Error");
      }
    } catch (error) {
      console.error("Error checking job status:", error);
    }
  }, [selectedCardId]);

  // Start polling for job status
  useEffect(() => {
    if (selectedCardId) {
      setIsProcessing(true);
      // Check immediately
      checkJobStatus();
      // Then poll every 2 seconds
      pollingIntervalRef.current = setInterval(checkJobStatus, 2000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [selectedCardId, checkJobStatus]);

  // Load image
  useEffect(() => {
    if (imagePath && !isProcessing) {
      setLoading(true);
      setImgError(false);
      authFetch(`${apiBaseUrl}/api/uploads/images/${selectedCardId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.url) {
            setSignedUrl(data.url);
          } else {
            setImgError(true);
            toast.loadFailed("image");
          }
        })
        .catch(() => {
          setImgError(true);
          toast.loadFailed("image");
        })
        .finally(() => setLoading(false));
    } else {
      setSignedUrl(null);
    }
  }, [imagePath, selectedCardId, isProcessing]);

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

      if (
        e.touches.length === 1 &&
        touchStartRef.current &&
        !isPinchingRef.current
      ) {
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
    setPan({ x: 150, y: 150 });
  }, [selectedCardId]);

  // Add event listeners
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    // Desktop events
    containerEl.addEventListener("wheel", handleWheel, { passive: false });

    // Legacy touch events (for compatibility)
    containerEl.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    containerEl.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    containerEl.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });

    return () => {
      containerEl.removeEventListener("wheel", handleWheel);
      containerEl.removeEventListener("touchstart", handleTouchStart);
      containerEl.removeEventListener("touchmove", handleTouchMove);
      containerEl.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={zoomIn}
          className="bg-white/80 hover:bg-white"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={zoomOut}
          className="bg-white/80 hover:bg-white"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          className="w-full h-full flex items-center justify-center p-2 sm:p-4"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transition:
              draggingRef.current || touchStartRef.current
                ? "none"
                : "transform 0.1s ease-out",
          }}
        >
          {loading && (
            <div className="text-sm text-gray-500">Loading image...</div>
          )}
          {isProcessing && (
            <div className="text-sm text-gray-500">Processing image...</div>
          )}
          {!loading && !isProcessing && signedUrl && !imgError && (
            <img
              ref={imgRef}
              src={signedUrl}
              alt={`Scanned card ${selectedCardId}`}
              draggable={false}
              style={{
                transform: `scale(${internalZoom * externalZoom})`,
                transformOrigin: "center",
                transition:
                  draggingRef.current || touchStartRef.current
                    ? "none"
                    : "transform 0.2s",
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
          {!loading && !isProcessing && imgError && (
            <div className="text-red-500 text-sm text-center p-4">
              Failed to load image.
            </div>
          )}
          {!loading && !isProcessing && !signedUrl && !imgError && (
            <div className="text-gray-500 text-sm text-center p-4">
              No image available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewImagePanel;
