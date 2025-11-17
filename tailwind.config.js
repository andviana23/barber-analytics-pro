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

      // === GRADIENTES - DESIGN SYSTEM ===
      backgroundImage: {
        // Gradientes primários
        'gradient-primary': 'linear-gradient(135deg, #1E8CFF 0%, #0072E0 100%)',
        'gradient-primary-hover':
          'linear-gradient(135deg, #0072E0 0%, #005BB5 100%)',

        // Gradientes de feedback
        'gradient-success': 'linear-gradient(135deg, #16A34A 0%, #059669 100%)',
        'gradient-error': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'gradient-info': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',

        // Gradientes especiais
        'gradient-purple': 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
        'gradient-orange': 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',

        // Gradientes sutis (para backgrounds)
        'gradient-light': 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      },

      transitionProperty: {
        colors:
          'color, background-color, border-color, text-decoration-color, fill, stroke',
      },

      transitionDuration: {
        300: '300ms',
      },

      boxShadow: {
        'glow-amber': '0 0 8px rgba(245, 158, 11, 0.5)',
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
  plugins: [
    // Plugin para esconder scrollbar mas manter funcionalidade
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE e Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari e Chrome */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
};
