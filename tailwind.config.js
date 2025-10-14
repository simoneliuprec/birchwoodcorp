/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        birchwood: {
          green: "#22322A",
          gold: "#B3A287"
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        chinese: ['Noto Serif SC', 'serif']
      }
    }
  },
  plugins: []
}