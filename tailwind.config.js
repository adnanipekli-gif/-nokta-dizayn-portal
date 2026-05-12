/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'portal-teal':    '#1B3D4F',
        'portal-cyan':    '#00C4CC',
        'portal-magenta': '#D4006A',
        'portal-page':    '#F8FAFC',
        'portal-card':    '#FFFFFF',
        'portal-border':  '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
