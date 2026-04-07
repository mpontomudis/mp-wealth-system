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
        'mp-primary':        '#4A90E2',
        'mp-primary-light':  '#74b1f0',
        'mp-primary-dark':   '#2c6db5',
        'mp-primary-hover':  '#3a7fce',
        'mp-green':          '#10b981',
        'mp-red':            '#ef4444',
        'mp-blue':           '#4A90E2',
        'mp-gold':           '#f59e0b',
        'mp-purple':         '#8b5cf6',
        // Teofin action colors
        'teofin-teal':       '#4ECDC4',
        'teofin-coral':      '#FF8B94',
        'teofin-yellow':     '#FFD166',
        'teofin-blue':       '#4A90E2',
        'teofin-purple':     '#A78BFA',
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
        'card-visa':       'linear-gradient(135deg, #A78BFA 0%, #7DD3FC 100%)',
        'card-mastercard': 'linear-gradient(135deg, #FB7185 0%, #FBBF24 100%)',
        'card-teal':       'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
        'card-green':      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'card-blue':       'linear-gradient(135deg, #4A90E2 0%, #7B9FE8 100%)',
        'card-purple':     'linear-gradient(135deg, #C7A1D9 0%, #7B9FE8 100%)',
        'action-teal':     'linear-gradient(135deg, #4ECDC4 0%, #2BC0B4 100%)',
        'action-coral':    'linear-gradient(135deg, #FF8B94 0%, #FF6B76 100%)',
        'action-yellow':   'linear-gradient(135deg, #FFD166 0%, #FFBF00 100%)',
        'action-blue':     'linear-gradient(135deg, #4A90E2 0%, #3a7fce 100%)',
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
