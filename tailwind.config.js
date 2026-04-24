/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        'abb': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        'meat': {
          cream: '#f5f5f5',
          light: '#FFB6B6',
          pink: '#FF6B6B',
          red: '#E85D5D',
          brown: '#8B4513',
          'brown-dark': '#654321',
          sauce: '#3D2314',
          potato: '#D2691E',
          green: '#228B22',
        },
        'dark': {
          bg: '#1a1512',
          card: '#2a221c',
          border: '#3d3228',
          hover: '#352d25',
          text: '#f5f5f5',
          muted: '#a89b8c',
        },
        'terminal': {
          bg: '#050505',
          card: '#0a0a0a',
          border: '#1a1a1a',
          text: '#e5e7eb',
          muted: '#9ca3af',
          cyan: '#22d3ee',
          green: '#4ade80',
          pink: '#f472b6',
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(232, 93, 93, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(232, 93, 93, 0.5)' },
        }
      },
      backgroundImage: {
        'grid-pattern': "url('https://grainy-gradients.vercel.app/noise.svg')",
      }
    },
  },
  plugins: [],
};

