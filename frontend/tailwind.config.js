/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FBFBFC',
          dark: '#0F1012',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#16181D',
          hover: '#FAFAFA',
          'dark-hover': '#1C1F26',
        },
        main: {
          DEFAULT: '#111827',
          dark: '#F3F4F6',
        },
        muted: {
          DEFAULT: '#6B7280',
          dark: '#9CA3AF',
        },
        line: {
          DEFAULT: '#E5E7EB',
          dark: '#26282E',
        },
        warm: {
          50: '#FDFBF7',
          100: '#F9F5EE',
          200: '#EDE4D6',
          600: '#D97706',
          700: '#B45309',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // Primary Accent
          700: '#1D4ED8', // Hover Accent
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        hover: '0 6px 16px -2px rgba(0, 0, 0, 0.06), 0 3px 6px -2px rgba(0, 0, 0, 0.04)',
        dropdown: '0 12px 28px -4px rgba(0, 0, 0, 0.08), 0 6px 12px -4px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        DEFAULT: '0.625rem', // 10px
        lg: '0.625rem',     // 10px
        xl: '0.875rem',     // 14px
        '2xl': '1rem',      // 16px
        '3xl': '1.25rem',   // 20px
      },
    },
  },
  plugins: [],
}
