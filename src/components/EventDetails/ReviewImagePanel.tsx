import React, { memo, useCallback } from "react";
import { ZoomIn, ZoomOut, QrCode, UserCheck } from "lucide-react";
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
            <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-blue-200">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <QrCode className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">QR Code Scan</h4>
                  <p className="text-xs text-gray-500 max-w-48">
                    Student information was captured via QR code scan - no physical card image available
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(ReviewImagePanel);
export { ReviewImagePanel };
