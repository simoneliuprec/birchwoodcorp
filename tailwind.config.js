/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'birchwood-green': '#314D40',
        'birchwood-gold': '#D4AF37',
        'rich-black': '#16181A',
        'light-gray': '#F7F7FA',
        'medium-gray': '#6B7280',

        // Optional short aliases (if you want to use text-primary etc.)
        primary: '#314D40',
        accent: '#D4AF37',
        dark: '#16181A',
        'gray-light': '#F7F7FA',
        'gray-medium': '#6B7280',
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui'],
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}