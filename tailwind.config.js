/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Minimal additions for PWA install prompt
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0ec8b8 0%, #0ea4d4 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
        'gradient-teal-coral': 'linear-gradient(135deg, #14B8A6 0%, #FF6B6B 100%)',
      },
      colors: {
        'coral': {
          50: '#FFF5F5',
          100: '#FFE5E5',
          200: '#FFCCCC',
          300: '#FF9999',
          400: '#FF6B6B',
          500: '#FF5252',
          600: '#FF4444',
          700: '#E63946',
          800: '#C62828',
          900: '#B71C1C',
        },
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'hover': '0 6px 28px rgba(0, 0, 0, 0.12)',
        'raised': '0 8px 32px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'card': '1.5rem',
        'button': '0.75rem',
      },
    },
  },
  plugins: [],
};
