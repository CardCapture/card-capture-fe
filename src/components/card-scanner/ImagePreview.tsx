import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScannerResult } from '@/types/card'; // Ensure this type exists

// 1. Remove onProcess from the interface
interface ImagePreviewProps {
  image: string;
  isProcessing: boolean;
  processingProgress: number;
  scanResult: ScannerResult | null;
  // onProcess: () => void; // Removed
  onReset: () => void;
}

const ImagePreview = ({
  image,
  isProcessing,
  processingProgress,
  scanResult,
  // onProcess, // 2. Remove from destructured parameters
  onReset
}: ImagePreviewProps) => {
  return (
    // The structure for displaying image, processing state, and results remains the same
    <div className="relative">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
        <img
          src={image}
          alt="Captured card"
          className="w-full h-full object-contain bg-black/5"
        />
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm">
          <RefreshCw size={40} className="text-white animate-spin mb-4" />
          <p className="text-white font-medium">Processing card...</p>
          <div className="w-3/4 mt-4">
            <Progress value={processingProgress} />
          </div>
        </div>
      )}

      {/* Scan Result Overlay */}
      {scanResult && !isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-lg backdrop-blur-sm">
          {scanResult.success ? (
             <div className="bg-white/90 rounded-xl p-6 max-w-sm text-center">
               <CheckCircle size={40} className="text-green-500 mx-auto mb-2" />
               <h3 className="text-xl font-medium">
                 {scanResult.missingFields?.length
                   ? "Partially Processed"
                   : "Successfully Processed"}
               </h3>
               {scanResult.missingFields?.length ? (
                 <p className="text-amber-600 text-sm mt-1">
                   Missing fields: {scanResult.missingFields.join(', ')}
                 </p>
               ) : (
                 <p className="text-green-600 text-sm mt-1">
                   All information was extracted
                 </p>
               )}
             </div>
           ) : (
             <div className="bg-white/90 rounded-xl p-6 max-w-sm text-center">
               <AlertTriangle size={40} className="text-red-500 mx-auto mb-2" />
               <h3 className="text-xl font-medium">Processing Failed</h3>
               <p className="text-red-600 text-sm mt-1">
                 {scanResult.errorMessage}
               </p>
             </div>
           )}
         </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4 justify-center">
         {/* 3. Remove the "Process Card" button */}
         {/* {!isProcessing && !scanResult && (
           <Button onClick={onProcess} className="rounded-full px-6">
             Process Card
           </Button>
         )} */}

         {/* Keep the Reset button */}
         <Button onClick={onReset} variant="outline" className="rounded-full px-6">
           <RefreshCw className="mr-2 h-4 w-4" />
           Reset {/* Or maybe "Scan Again"? */}
         </Button>
       </div>
     </div>
  );
};

export default ImagePreview;