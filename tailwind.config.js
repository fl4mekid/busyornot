/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/script.js",
    "./css/special.css"
  ],
  theme: {
    extend: {
      colors: {
        'busy': '#FF4D6D',
        'available': '#48fb00',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 