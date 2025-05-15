import { useState, useCallback } from "react";

export function useZoom(
  initialZoom: number = 0.47,
  minZoom: number = 0.47,
  maxZoom: number = 2
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
