import * as React from 'react';
import { clsx } from 'clsx';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={clsx("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div 
      className={clsx("nav-tabs-container", className)}
              style={{
                background: 'white',
                border: 'none',
                borderBottom: 'none',
                outline: 'none',
                padding: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'stretch',
                gap: 0,
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                margin: 0
              }}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className, style }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const isActive = context.value === value;
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => context.onValueChange(value)}
      className={clsx(
        "nav-tab-button",
        isActive ? "active" : "",
        className
      )}
      style={{
        ...style,
        color: isActive ? '#FFFFFF' : '#6B7280',
        backgroundColor: isActive ? '#14B8A6' : 'transparent',
        fontWeight: isActive ? 600 : 500,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '16px 24px',
        fontSize: '14px',
        border: 'none !important',
        borderBottom: 'none !important',
        borderTop: 'none !important',
        borderLeft: 'none !important',
        borderRight: 'none !important',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        minHeight: '56px',
        borderRadius: '0',
        boxShadow: isActive ? '0 2px 8px rgba(20, 184, 166, 0.3)' : 'none',
        flex: 1,
        margin: 0,
        outline: 'none !important',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none'
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = 'none';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.border = 'none';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.border = 'none';
      }}
             onMouseEnter={(e) => {
               if (!isActive) {
                 // Inactive tab hover: light teal
                 e.currentTarget.style.color = '#374151';
                 e.currentTarget.style.backgroundColor = '#D7F2EE'; // Light teal
               } else {
                 // Active tab hover: slightly lighter teal
                 e.currentTarget.style.backgroundColor = '#6DD5C7'; // Slightly lighter teal
               }
             }}
             onMouseLeave={(e) => {
               if (!isActive) {
                 // Return inactive tab to normal state
                 e.currentTarget.style.color = '#6B7280';
                 e.currentTarget.style.backgroundColor = 'transparent';
               } else {
                 // Return active tab to normal teal
                 e.currentTarget.style.backgroundColor = '#14B8A6'; // Original teal (#14B8A6)
               }
             }}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  if (context.value !== value) return null;
  
  return (
    <div
      role="tabpanel"
      data-state={context.value === value ? 'active' : 'inactive'}
      className={className}
    >
      {children}
    </div>
  );
}