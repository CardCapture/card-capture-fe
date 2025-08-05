import React from 'react';
import { SignupSheetUpload } from '@/components/SignupSheetUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload } from 'lucide-react';

interface SignupSheetSectionProps {
  eventId: string;
  schoolId: string;
  onUploadComplete: () => void;
}

/**
 * Section component for handling both inquiry cards and signup sheets
 * This can be integrated into your existing EventDetails component
 */
export function SignupSheetSection({ 
  eventId, 
  schoolId, 
  onUploadComplete 
}: SignupSheetSectionProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Options
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="inquiry-cards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inquiry-cards" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Inquiry Cards
            </TabsTrigger>
            <TabsTrigger value="signup-sheets" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Sign-up Sheets
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inquiry-cards" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Inquiry Card Upload</h3>
              <p className="text-sm text-gray-600">
                Upload individual inquiry cards for processing through DocAI and Gemini.
              </p>
              {/* Your existing inquiry card upload component goes here */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-500">
                  [Your existing inquiry card upload component]
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="signup-sheets" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sign-up Sheet Upload</h3>
              <p className="text-sm text-gray-600">
                Upload a photo of a completed sign-up sheet table. Each filled row will become a separate record.
              </p>
              <SignupSheetUpload
                eventId={eventId}
                schoolId={schoolId}
                onUploadComplete={onUploadComplete}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}