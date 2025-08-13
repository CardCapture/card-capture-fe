import React from 'react';
import { cn } from '@/lib/utils';

interface FormStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
}

export function FormStep({ title, subtitle, children, className, isActive }: FormStepProps) {
  return (
    <div
      className={cn(
        "w-full transition-all duration-300 ease-in-out",
        isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none absolute",
        className
      )}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-gray-600 text-lg">
            {subtitle}
          </p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}