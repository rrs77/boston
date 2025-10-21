import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

// Main Logo Component - matches the shared design
export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: { 
      container: 'h-12 w-12',
      text: 'text-lg',
      subtext: 'text-xs',
      iconSize: 48
    },
    md: { 
      container: 'h-16 w-16',
      text: 'text-xl',
      subtext: 'text-sm',
      iconSize: 64
    },
    lg: { 
      container: 'h-20 w-20',
      text: 'text-2xl',
      subtext: 'text-base',
      iconSize: 80
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* CD Logo in Circle */}
      <div className={`${currentSize.container} flex-shrink-0 relative`}>
        <svg 
          viewBox="0 0 80 80" 
          className="w-full h-full"
          style={{ fill: 'none' }}
        >
          {/* Circular background with teal gradient */}
          <circle
            cx="40"
            cy="40"
            r="38"
            fill="url(#tealGradient)"
          />
          
          {/* CD Text */}
          <text
            x="40"
            y="40"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="32"
            fontWeight="700"
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            letterSpacing="-1"
          >
            CD
          </text>
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="50%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#008272" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 
            className={`font-bold text-black leading-tight ${currentSize.text}`}
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 700
            }}
          >
            Creative
          </h1>
          <p 
            className={`text-black font-medium ${currentSize.subtext}`}
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 500
            }}
          >
            Curriculum Designer
          </p>
        </div>
      )}
    </div>
  );
}

// Alias for backward compatibility
export const LogoSVG = Logo;
