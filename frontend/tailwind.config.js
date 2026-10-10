/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1e293b',
          900: '#0f172a',
        },
        brand: {
          blue: '#2563eb',
          light: '#eff6ff',
        }
      }
    },
  },
  plugins: [],
}
