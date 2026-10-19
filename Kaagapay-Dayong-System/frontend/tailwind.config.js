/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#eef7f1',
          100: '#d7ecdd',
          200: '#b0d9bd',
          300: '#80bf95',
          400: '#4fa070',
          500: '#2f8556',
          600: '#216b45',
          700: '#1a5637',
          800: '#154430',
          900: '#10352a'
        },
        ink: {
          700: '#243d33',
          800: '#183129',
          900: '#10231a'
        }
      }
    }
  },
  plugins: [],
};
