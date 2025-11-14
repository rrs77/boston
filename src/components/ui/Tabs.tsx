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
      className={clsx(
        "bg-white rounded-card shadow-soft p-1.5 flex items-stretch gap-2",
        className
      )}
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
        "flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500",
        isActive 
          ? "bg-gradient-primary text-white shadow-soft" 
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
        className
      )}
      style={style}
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