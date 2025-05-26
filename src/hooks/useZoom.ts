import { useState, useCallback } from "react";

export function useZoom(
  initialZoom: number = 0.85,
  minZoom: number = 0.3,
  maxZoom: number = 3
) {
  const [zoom, setZoom] = useState(initialZoom);

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(z * 1.2, maxZoom)),
    [maxZoom]
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(z / 1.2, minZoom)),
    [minZoom]
  );

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
  };
}
