/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        'background-dark': '#020617',
        cards: '#1e293b',
        'cards-dark': '#0f172a',
        accent: '#22d3ee',
        'accent-dark': '#06b6d4',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      }
    },
  },
  plugins: [],
}
