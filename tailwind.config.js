import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui tokens (New York style — slate base)
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        blue: {
          50:  '#F0F7FF',
          100: '#E0EFFF',
          200: '#B3D9FF',
          300: '#8AC6FF',
          400: '#4D9EFF',
          500: '#2B87D1',
          600: '#0055A4',
          700: '#004483',
          800: '#003366',
          900: '#002244',
          950: '#001122',
        },
        slate: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#D1D1D1',
          400: '#B0B0B0',
          500: '#94A3B8',
          600: '#475569',
          700: '#333333',
          800: '#333333',
          900: '#000000',
          950: '#000000',
        },
        // Design Tokens — Story 1.3.3
        brand: {
          200: 'var(--color-brand-200)',
          500: 'var(--color-brand-500)',
          700: 'var(--color-brand-700)',
        },
        surface: 'var(--color-surface)',
        sidebar: 'var(--color-sidebar)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger:  'var(--color-danger)',
        info:    'var(--color-info)',
        unit: {
          nexus:  'var(--color-unit-nexus)',
          mivave: 'var(--color-unit-mivave)',
          vcchic: 'var(--color-unit-vcchic)',
          moriel: 'var(--color-unit-moriel)',
          sezo:   'var(--color-unit-sezo)',
        },
      },
      borderRadius: {
        xs:   'var(--radius-xs)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sidebar:  'var(--z-sidebar)',
        voice:    'var(--z-voice)',
        modal:    'var(--z-modal)',
        toast:    'var(--z-toast)',
        critical: 'var(--z-critical)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      fontSize: {
        nano:    'var(--text-nano)',
        micro:   'var(--text-micro)',
        xs:      'var(--text-xs)',
        sm:      'var(--text-sm)',
        base:    'var(--text-base)',
        md:      'var(--text-md)',
        lg:      'var(--text-lg)',
        xl:      'var(--text-xl)',
        '2xl':   'var(--text-2xl)',
        '3xl':   'var(--text-3xl)',
        display: 'var(--text-display)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

