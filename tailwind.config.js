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
      },
      colors: {
        'abb-bg': '#f8f9fa',
        'abb-bg-dark': '#0c0c0c',
        'abb-bg-card': '#ffffff',
        'abb-cyan': '#22d3ee',
        'abb-cyan-dark': '#0891b2',
        'abb-text': '#111827',
        'abb-text-muted': '#6b7280',
        'abb-border': '#e5e7eb',
      },
    },
  },
  plugins: [],
};
