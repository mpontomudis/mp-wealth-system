/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        'mp-primary':       '#0A1F44',
        'mp-primary-light': '#1a3a64',
        'mp-primary-dark':  '#051429',
        'mp-primary-hover': '#0d2a54',
        'mp-green':         '#10b981',
        'mp-red':           '#ef4444',
        'mp-blue':          '#3b82f6',
        'mp-gold':          '#f59e0b',
        'mp-purple':        '#8b5cf6',
        'mp-background':    '#f8fafc',
        'mp-surface':       '#ffffff',
        'mp-border':        '#e2e8f0',
        'mp-text-primary':  '#0f172a',
        'mp-text-secondary':'#64748b',
        'mp-text-muted':    '#94a3b8',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
      },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};
