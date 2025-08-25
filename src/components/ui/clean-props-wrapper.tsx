import React from 'react';

interface CleanPropsWrapperProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  [key: string]: any;
}

export function CleanPropsWrapper({ 
  children, 
  as: Component = 'div', 
  className,
  ...props 
}: CleanPropsWrapperProps) {
  // Filter out any data-lov-* props that might be injected by development tools
  const cleanProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => !key.startsWith('data-lov'))
  );

  return (
    <Component className={className} {...cleanProps}>
      {children}
    </Component>
  );
}