import React, { useState } from 'react';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { useProfile } from '@/hooks/useProfile';
import { Upload, FileImage, Loader2, Camera } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import CameraCapture from '@/components/card-scanner/CameraCapture';

interface SignupSheetUploadProps {
  eventId: string;
  schoolId: string;
  onUploadComplete: () => void;
  className?: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  records_created: number;
  records_extracted: number;
  document_ids: string[];
}

export function SignupSheetUpload({ 
  eventId, 
  schoolId, 
  onUploadComplete, 
  className = "" 
}: SignupSheetUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const { profile } = useProfile();

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    // Convert data URL to File object
    const dataUrlToFile = (dataUrl: string, filename: string): File => {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    };

    const file = dataUrlToFile(imageDataUrl, `signup_sheet_${Date.now()}.png`);
    setSelectedFile(file);
    setShowCamera(false);
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
  };

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    if (!eventId || !schoolId) {
      toast.error('Missing event or school information');
      return;
    }

    // Close modal immediately and start processing
    onUploadComplete(); // This will close the modal and trigger loading state
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('event_id', eventId);
      formData.append('school_id', schoolId);

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      const response = await authFetch(`${apiBaseUrl}/upload-signup-sheet`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      const result: UploadResult = await response.json();

      // Show success message
      toast.success(
        `✅ Sign-up sheet processed successfully!\n` +
        `Created ${result.records_created} records from ${result.records_extracted} rows.\n` +
        `Check the "Needs Review" tab to verify and approve each record.`
      );

    } catch (error) {
      logger.error('Signup sheet upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="space-y-4 pt-6">
        {/* Camera View */}
        {showCamera ? (
          <div className="rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <CameraCapture
              onCapture={handleCameraCapture}
              onCancel={handleCameraCancel}
            />
          </div>
        ) : (
          <>
            {/* Upload Options */}
            <div className="flex gap-3 mb-4">
              <Button
                onClick={() => document.getElementById('signup-sheet-file-input')?.click()}
                variant="outline"
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <Button
                onClick={handleTakePhoto}
                variant="outline"
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>

            {/* Drag & Drop Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                ${dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : selectedFile 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              onClick={() => document.getElementById('signup-sheet-file-input')?.click()}
            >
          <input
            id="signup-sheet-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            
            {selectedFile ? (
              <div>
                <p className="font-medium text-green-700">{selectedFile.name}</p>
                <p className="text-sm text-green-600">
                  {formatFileSize(selectedFile.size)} • Ready to upload
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Drop files here</span> or use buttons above
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile}
          className="w-full"
          size="lg"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Sign-up Sheet
        </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}