import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    ...props
  }, ref) => {
    const baseStyles = 'px-4 py-2.5 text-base text-slate-900 bg-white border rounded-button transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
    const errorStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500';
    const iconPaddingStyles = Icon
      ? iconPosition === 'left' ? 'pl-11' : 'pr-11'
      : '';
    
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && (
            <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0' : 'right-0'} flex items-center ${iconPosition === 'left' ? 'pl-3' : 'pr-3'} pointer-events-none`}>
              <Icon className="h-5 w-5 text-slate-400" />
            </div>
          )}
          
          <input
            ref={ref}
            className={`${baseStyles} ${errorStyles} ${iconPaddingStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
          />
        </div>
        
        {error && (
          <p className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

