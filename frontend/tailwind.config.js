/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cookie: {
          sky: '#8bd3ff',
          pill: '#d8f1ff',
          navy: '#0b1f3a',
          gold: '#ffe0a8',
          goldDark: '#f59e0b',
          baked: '#d97706',
          surface: '#ffffff'
        }
      }
    },
  },
  plugins: [],
}
