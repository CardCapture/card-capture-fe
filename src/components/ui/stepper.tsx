import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Simple text indicator */}
      <div className="block sm:hidden">
        <p className="text-sm text-gray-600 text-center mb-4">
          Step {currentStep + 1} of {steps.length}
        </p>
        <p className="text-lg font-medium text-center text-gray-900 mb-6">
          {steps[currentStep]}
        </p>
      </div>

      {/* Desktop: Visual stepper */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    index < currentStep
                      ? "bg-green-500 border-green-500 text-white"
                      : index === currentStep
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-300 text-gray-500"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs mt-2 max-w-20 text-center transition-colors duration-300",
                    index <= currentStep ? "text-gray-900 font-medium" : "text-gray-500"
                  )}
                >
                  {step}
                </p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors duration-300",
                    index < currentStep ? "bg-green-500" : "bg-gray-300"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Progress bar for mobile */}
      <div className="block sm:hidden">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}