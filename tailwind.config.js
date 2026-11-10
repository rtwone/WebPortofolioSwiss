/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f5f0',
        surface: '#fcfbf9',
        ink: '#181818',
        slateWarm: '#3a3835',
        earthMuted: '#5c5852',
        bronze: '#8c7355',
        statusGreen: '#16a34a',
        hairline: '#d8d2c7',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        calligraphic: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        editorial: '4px 4px 0px 0px #181818',
        editorialSubtle: '3px 3px 0px 0px #d8d2c7',
      },
    },
  },
  plugins: [],
};
