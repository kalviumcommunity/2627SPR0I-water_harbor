/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#10132b',
        cobalt: '#2237ff',
        coral: '#ff5a4e',
        sun: '#ffd23f',
        mint: '#35d99a',
        lilac: '#c9b8ff',
        sky: '#d9f1ff',
        paper: '#fffdf7',
      },
      fontFamily: {
        heading: ['"Bagel Fat One"', 'cursive', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0px #10132b',
        'hard-sm': '2px 2px 0px #10132b',
        'hard-lg': '6px 6px 0px #10132b',
        'hard-xl': '8px 8px 0px #10132b',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
