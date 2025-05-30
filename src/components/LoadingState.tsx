import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  );
} 