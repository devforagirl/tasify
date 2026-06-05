/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: '#0f1117',
          surface: '#1a1b26',
          border: '#2a2b3d',
          accent: '#6c5ce7',
          green: '#00e676',
          yellow: '#ffd54f',
          red: '#ff5252',
          blue: '#448aff',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
