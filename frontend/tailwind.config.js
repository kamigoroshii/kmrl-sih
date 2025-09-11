/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'olive': {
          50: '#f9faf7',
          100: '#f2f4ed',
          200: '#e1e7d3',
          300: '#c7d4ab',
          400: '#a8bd7b',
          500: '#8ba355',
          600: '#6b8041',
          700: '#546435',
          800: '#45522d',
          900: '#3a4628',
        },
        'beige': {
          50: '#fdfcf9',
          100: '#faf8f1',
          200: '#f4f0e1',
          300: '#ebe4cc',
          400: '#ddd4aa',
          500: '#cdc088',
          600: '#b8a470',
          700: '#9a875c',
          800: '#7f704e',
          900: '#695c42',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}