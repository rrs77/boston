/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary teal gradient colors
        'primary-start': '#0ec8b8',
        'primary-end': '#0ea4d4',
        
        // Teal palette
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
        
        // Surface colors
        surface: {
          white: '#ffffff',
          muted: '#f1f5f9',
        },
        
        // Text colors (using slate)
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      
      fontSize: {
        'page-title': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '600' }],
        'section-title': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.0125em', fontWeight: '600' }],
        'card-title': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      
      borderRadius: {
        'card': '1.5rem',  // 24px - xl
        'button': '0.75rem', // 12px - md
      },
      
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'hover': '0 6px 28px rgba(0, 0, 0, 0.12)',
        'raised': '0 8px 32px rgba(0, 0, 0, 0.15)',
        'teal': '0 8px 24px rgba(14, 200, 184, 0.25)',
        'teal-hover': '0 12px 32px rgba(14, 200, 184, 0.35)',
      },
      
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0ec8b8 0%, #0ea4d4 100%)',
        'gradient-teal': 'linear-gradient(135deg, #0ec8b8 0%, #0ea4d4 100%)',
      },
      
      transitionDuration: {
        'fast': '150ms',
        'default': '200ms',
        'slow': '300ms',
      },
      
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
