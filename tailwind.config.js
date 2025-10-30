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
          hover: '#F3F4F6',
          border: '#E2E8F0',
        },

        // === CORES NEUTRAS - DARK MODE ===
        dark: {
          bg: '#0C0F12',
          surface: '#161B22',
          hover: '#1F2937',
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

      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
