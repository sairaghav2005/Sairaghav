/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        'background-dark': '#f1f5f9',
        cards: '#ffffff',
        'cards-dark': '#f8fafc',
        accent: '#2563eb',
        'accent-dark': '#1d4ed8',
        'accent-light': '#eff6ff',
        danger: '#dc2626',
        warning: '#d97706',
        success: '#16a34a',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
