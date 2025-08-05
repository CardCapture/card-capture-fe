import React from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SignupSheetProcessingProps {
  show: boolean;
}

export function SignupSheetProcessing({ show }: SignupSheetProcessingProps) {
  if (!show) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-3">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          Processing sign-up sheet...
        </span>
      </div>
      
      <Progress className="h-2 bg-blue-100" />
    </div>
  );
}