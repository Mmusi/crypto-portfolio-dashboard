/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'crypto-dark': '#0f172a',
        'crypto-card': '#1e293b',
        'crypto-green': '#10b981',
        'crypto-red': '#ef4444',
        'crypto-blue': '#3b82f6',
      }
    },
  },
  plugins: [],
}
