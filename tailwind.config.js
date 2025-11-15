/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Minimal additions for PWA install prompt
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0ec8b8 0%, #0ea4d4 100%)',
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
