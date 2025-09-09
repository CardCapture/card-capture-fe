import React from 'react';
import OTPInput from './OTPInput';

interface MFAChallengeModalProps {
  isOpen: boolean;
  onComplete: (code: string) => void;
  onResend: () => void;
  isLoading: boolean;
  error: string | null;
  phoneLastFour: string;
  rememberDevice: boolean;
  onRememberDeviceChange: (value: boolean) => void;
}

const MFAChallengeModal: React.FC<MFAChallengeModalProps> = ({
  isOpen,
  onComplete,
  onResend,
  isLoading,
  error,
  phoneLastFour,
  rememberDevice,
  onRememberDeviceChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <OTPInput
          onComplete={onComplete}
          onResend={onResend}
          isLoading={isLoading}
          error={error}
          phoneLastFour={phoneLastFour}
        />
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => onRememberDeviceChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Remember this device for 30 days
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            You won't need to enter a code on this device for 30 days
          </p>
        </div>
      </div>
    </div>
  );
};

export default MFAChallengeModal;