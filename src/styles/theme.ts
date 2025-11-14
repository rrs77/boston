/**
 * Design System Theme
 * Modern, clean education SaaS aesthetic
 */

export const theme = {
  // Colors
  colors: {
    // Primary gradient
    primary: {
      start: '#0ec8b8',
      end: '#0ea4d4',
      gradient: 'linear-gradient(135deg, #0ec8b8 0%, #0ea4d4 100%)',
    },
    
    // Surfaces
    surface: {
      white: '#ffffff',
      muted: '#f1f5f9',
      glass: 'rgba(255, 255, 255, 0.95)',
    },
    
    // Text
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#64748b',
      inverse: '#ffffff',
    },
    
    // Accents
    accent: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    // Teal shades (from primary)
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#0ec8b8',
      600: '#0ea4d4',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
  },
  
  // Spacing
  spacing: {
    cardPadding: {
      sm: '1rem',    // 16px
      md: '1.5rem',  // 24px
      lg: '2rem',    // 32px
    },
    pagePadding: {
      x: '2.5rem',   // 40px
      y: '2rem',     // 32px
    },
    gap: {
      sm: '0.75rem', // 12px
      md: '1rem',    // 16px
      lg: '1.5rem',  // 24px
      xl: '2rem',    // 32px
    },
  },
  
  // Border Radius
  radius: {
    sm: '0.5rem',    // 8px - small elements
    md: '0.75rem',   // 12px - buttons
    lg: '1rem',      // 16px - cards
    xl: '1.5rem',    // 24px - large cards
    full: '9999px',  // pills/circles
  },
  
  // Shadows
  shadows: {
    // Soft neumorphic shadows
    soft: '0 4px 20px rgba(0, 0, 0, 0.06)',
    hover: '0 6px 28px rgba(0, 0, 0, 0.12)',
    raised: '0 8px 32px rgba(0, 0, 0, 0.15)',
    
    // Colored shadows (for primary elements)
    teal: '0 8px 24px rgba(14, 200, 184, 0.25)',
    tealHover: '0 12px 32px rgba(14, 200, 184, 0.35)',
  },
  
  // Typography
  typography: {
    // Page titles
    pageTitle: {
      size: '1.875rem',  // 30px
      weight: '600',
      tracking: '-0.025em',
      lineHeight: '1.2',
    },
    
    // Section titles
    sectionTitle: {
      size: '1.25rem',   // 20px
      weight: '600',
      tracking: '-0.0125em',
      lineHeight: '1.3',
    },
    
    // Card titles
    cardTitle: {
      size: '1.125rem',  // 18px
      weight: '600',
      lineHeight: '1.4',
    },
    
    // Body text
    body: {
      size: '1rem',      // 16px
      weight: '400',
      lineHeight: '1.5',
    },
    
    // Labels
    label: {
      size: '0.875rem',  // 14px
      weight: '500',
      lineHeight: '1.4',
    },
    
    // Small text
    small: {
      size: '0.8125rem', // 13px
      weight: '400',
      lineHeight: '1.4',
    },
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-out',
    default: '200ms ease-out',
    slow: '300ms ease-out',
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

// Utility functions
export const getGradientStyle = () => ({
  background: theme.colors.primary.gradient,
});

export const getSoftShadow = () => ({
  boxShadow: theme.shadows.soft,
});

export const getHoverShadow = () => ({
  boxShadow: theme.shadows.hover,
});

export type Theme = typeof theme;

