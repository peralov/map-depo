/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5c6ac4',
          light: '#7c86d8',
          dark: '#434190',
        },
        secondary: {
          DEFAULT: '#ecc94b',
          light: '#f6e05e',
          dark: '#b7791f',
        },
      },
    },
  },
  plugins: [],
}
