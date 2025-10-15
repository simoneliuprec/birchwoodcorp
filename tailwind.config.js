/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'birchwood-green': '#314D40',
        'birchwood-gold': '#D4AF37',
        'rich-black': '#16181A',
        'light-gray': '#F7F7FA',
        'medium-gray': '#6B7280'
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}