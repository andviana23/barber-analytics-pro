/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Habilita dark mode via classe
  theme: {
    extend: {
      colors: {
        // === CORES PRIMÁRIAS ===
        primary: {
          DEFAULT: '#4DA3FF',
          hover: '#1E8CFF',
          light: '#E8F3FF',
        },

        // === CORES NEUTRAS - LIGHT MODE ===
        light: {
          bg: '#F9FAFB',
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },

        // === CORES NEUTRAS - DARK MODE ===
        dark: {
          bg: '#0F172A',
          surface: '#1E293B',
          border: '#334155',
        },

        // === CORES DE TEXTO - LIGHT MODE ===
        'text-light': {
          primary: '#1E293B',
          secondary: '#64748B',
        },

        // === CORES DE TEXTO - DARK MODE ===
        'text-dark': {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
        },

        // === FEEDBACK - LIGHT MODE ===
        'feedback-light': {
          success: '#16A34A',
          error: '#EF4444',
          warning: '#F59E0B',
        },

        // === FEEDBACK - DARK MODE ===
        'feedback-dark': {
          success: '#22C55E',
          error: '#F87171',
          warning: '#FBBF24',
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
