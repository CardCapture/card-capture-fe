import React, { memo, useCallback } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSignedImageUrl } from "@/lib/imageUtils";
import { useEffect, useState } from "react";

interface ReviewImagePanelProps {
  imagePath: string;
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  selectedCardId?: string;
}

const ReviewImagePanel: React.FC<ReviewImagePanelProps> = ({
  imagePath,
  zoom,
  zoomIn,
  zoomOut,
  selectedCardId,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    async function updateImageUrl() {
      if (imagePath) {
        const signedUrl = await getSignedImageUrl(imagePath);
        setImageUrl(signedUrl);
      } else {
        setImageUrl("");
      }
    }
    updateImageUrl();
  }, [imagePath]);

  return (
    <div className="border-r lg:border-r-0 lg:border-b-0 flex flex-col h-full">
      <div className="p-3 sm:p-6 border-b flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Card Image</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="px-2 py-1 text-sm bg-gray-100 rounded">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Card to review"
              className="w-full h-auto rounded-lg border transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(ReviewImagePanel);
export { ReviewImagePanel };
