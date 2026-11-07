/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          900: '#0C1340',
          700: '#1B2559',
          500: '#2D3A7A',
        },
        paper: {
          50: '#F7F8FC',
          100: '#ECEEF7',
          200: '#D9DCF0',
        },
        signal: '#4F6BF4',
      }
    },
  },
  plugins: [],
};
