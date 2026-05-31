/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'warroom': {
          bg: '#0a0a0a',
          panel: '#111111',
          border: '#262626',
          accent: '#00ff9d', // Verde neón para "Capital Salvado"
          danger: '#ff3333', // Rojo para "Fugas / DailyLoss"
        }
      }
    },
  },
  plugins: [],
}