import React from 'react';
import IconLogo from '../../cc logo files/cc-logo-only-transparent.svg';
import TextLogo from '../../cc logo files/cc-logo-text-transparent.svg';
import FullLogo from '../../cc logo files/cc-full-logo-transparent.svg';

/**
 * Logo component for Card Capture.
 *
 * Props:
 * - type: 'icon' | 'text' | 'full' (default: 'full')
 * - className: optional string for custom classes
 * - style: optional React.CSSProperties for inline styles
 *
 * Example usage:
 *
 * // NavBar (icon only)
 * <Logo type="icon" className="h-8 w-8" />
 *
 * // Landing Page (full logo)
 * <Logo type="full" style={{ width: 240 }} />
 *
 * // Footer (text logo)
 * <Logo type="text" className="h-6" />
 */
export type LogoType = 'icon' | 'text' | 'full';

export interface LogoProps {
  type?: LogoType;
  className?: string;
  style?: React.CSSProperties;
}

const logoMap = {
  icon: IconLogo,
  text: TextLogo,
  full: FullLogo,
};

const Logo: React.FC<LogoProps> = ({ type = 'full', className, style }) => {
  const LogoSvg = logoMap[type] || FullLogo;
  return (
    <img
      src={LogoSvg}
      alt={`Card Capture ${type} logo`}
      className={className}
      style={style}
      draggable={false}
    />
  );
};

export default Logo; 