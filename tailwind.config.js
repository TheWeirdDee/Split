/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D0D',
        surface: '#161616',
        'surface-2': '#1F1F1F',
        border: '#2C2C2C',
        'text-primary': '#F7F3EC',
        'text-secondary': '#8A8A8A',
        'text-muted': '#4A4A4A',
        brand: '#00C896',
        'brand-dim': 'rgba(0,200,150,0.12)',
        'brand-dark': '#009E78',
        'money-positive': '#00C896',
        'money-negative': '#FF5C5C',
        'money-settled': '#4A4A4A',
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
