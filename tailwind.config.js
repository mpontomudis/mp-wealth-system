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
        // shadcn CSS-variable-based tokens
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Legacy mp-* tokens — structural ones use CSS vars for theme switching
        'mp-primary':        '#3b82f6',
        'mp-primary-light':  '#60a5fa',
        'mp-primary-dark':   '#1d4ed8',
        'mp-primary-hover':  '#2563eb',
        'mp-green':          '#10b981',
        'mp-red':            '#ef4444',
        'mp-blue':           '#3b82f6',
        'mp-gold':           '#f59e0b',
        'mp-purple':         '#8b5cf6',
        'mp-background':     'hsl(var(--mp-background))',
        'mp-surface':        'hsl(var(--mp-surface))',
        'mp-border':         'hsl(var(--mp-border))',
        'mp-text-primary':   'hsl(var(--mp-text-primary))',
        'mp-text-secondary': 'hsl(var(--mp-text-secondary))',
        'mp-text-muted':     'hsl(var(--mp-text-muted))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card:        '0 4px 24px 0 rgb(0 0 0 / 0.3)',
        'card-hover':'0 8px 40px 0 rgb(0 0 0 / 0.4)',
        glow:        '0 0 20px rgb(59 130 246 / 0.3)',
        'glow-lg':   '0 0 40px rgb(59 130 246 / 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      },
      keyframes: {
        'border-beam': {
          '100%': { 'offset-distance': '100%' },
        },
        'shine': {
          '0%': { 'background-position': '200% center' },
          '100%': { 'background-position': '-200% center' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'spin-slow':     'spin 1.5s linear infinite',
        'border-beam':   'border-beam calc(var(--duration)*1s) infinite linear',
        'shine':         'shine 8s ease-in-out infinite',
        'fade-in':       'fade-in 0.4s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'pulse-slow':    'pulse-slow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
