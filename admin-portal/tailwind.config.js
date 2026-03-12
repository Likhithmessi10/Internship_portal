/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8',
        secondary: '#0f172a',
        accent: '#f59e0b',
        background: '#f8fafc',
        text: '#1e293b',
        muted: '#64748b',
      }
    },
  },
  plugins: [],
}
