/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Habilita dark mode via classe
  theme: {
    screens: {
      xs: '375px', // iPhone SE, small phones
      sm: '640px', // Large phones
      md: '768px', // Tablets portrait
      lg: '1024px', // Tablets landscape / Small desktop
      xl: '1280px', // Desktop
      '2xl': '1536px', // Large desktop
      '3xl': '1920px', // Ultra wide
    },
    extend: {
      colors: {
        // === CORES PRIMÁRIAS ===
        primary: {
          DEFAULT: '#1E8CFF',
          hover: '#0072E0',
          light: '#E9F3FF',
        },

        // === CORES NEUTRAS - LIGHT MODE ===
        light: {
          bg: '#F9FAFB',
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },

        // === CORES NEUTRAS - DARK MODE ===
        dark: {
          bg: '#0C0F12',
          surface: '#161B22',
          border: '#242C37',
        },

        // === CORES DE TEXTO - LIGHT MODE ===
        'text-light': {
          primary: '#1E293B',
          secondary: '#64748B',
        },

        // === CORES DE TEXTO - DARK MODE ===
        'text-dark': {
          primary: '#F5F7FA',
          secondary: '#A5AFBE',
        },

        // === FEEDBACK - LIGHT MODE ===
        'feedback-light': {
          success: '#16A34A',
          error: '#EF4444',
          warning: '#F59E0B',
        },

        // === FEEDBACK - DARK MODE ===
        'feedback-dark': {
          success: '#3BD671',
          error: '#FF7E5F',
          warning: '#F4B400',
        },
      },

      transitionProperty: {
        colors:
          'color, background-color, border-color, text-decoration-color, fill, stroke',
      },

      transitionDuration: {
        300: '300ms',
      },
    },
  },
  plugins: [],
};
