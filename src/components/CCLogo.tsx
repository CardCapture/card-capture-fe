import React from 'react'
import logoOnly from '../../assets/cc-logo-only.svg'

interface CCLogoProps {
  className?: string
  style?: React.CSSProperties
  expanded?: boolean
}

export function CCLogo({ className, style }: CCLogoProps) {
  return (
    <img
      src={logoOnly}
      alt="Card Capture Logo"
      className={className}
      style={{ height: '32px', width: 'auto', ...style }}
    />
  )
} 