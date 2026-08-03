/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        deep: {
          50: 'var(--color-deep-50)',
          100: 'var(--color-deep-100)',
          200: 'var(--color-deep-200)',
          300: 'var(--color-deep-300)',
          400: 'var(--color-deep-400)',
          500: 'var(--color-deep-500)',
          600: 'var(--color-deep-600)',
          700: 'var(--color-deep-700)',
          800: 'var(--color-deep-800)',
          900: 'var(--color-deep-900)',
          950: 'var(--color-deep-950)',
        },
        nebula: {
          50: 'var(--color-nebula-50)',
          100: 'var(--color-nebula-100)',
          300: 'var(--color-nebula-300)',
          500: 'var(--color-nebula-500)',
          700: 'var(--color-nebula-700)',
          900: 'var(--color-nebula-900)',
        },
        star: {
          gold: 'var(--color-star-gold)',
          white: 'var(--color-star-white)',
          blue: 'var(--color-star-blue)',
          red: 'var(--color-star-red)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          muted: 'var(--color-surface-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 4px 20px var(--shadow-card)',
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
    },
  },
  plugins: [],
};
