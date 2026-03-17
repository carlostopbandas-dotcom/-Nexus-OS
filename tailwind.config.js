/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
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
      },
    },
  },
  plugins: [],
}

