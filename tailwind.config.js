export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, i / 100])),
      colors: {
        brand: {
          50: '#eef6ff', 100: '#d9eaff', 200: '#bcdbff', 300: '#8ec4ff',
          400: '#59a4ff', 500: '#2b83f6', 600: '#1466e3', 700: '#0f51c0',
          800: '#12459b', 900: '#143d7b',
        },
        accent: { 50: '#fff5ed', 500: '#f97316', 600: '#e45c05' },
        navy: { 950: '#0f1b2d', 900: '#0f1b2d', 800: '#12459b', 700: '#0f51c0', 600: '#1466e3' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { soft: '0 1px 2px rgba(15,27,45,0.04), 0 6px 20px -14px rgba(15,27,45,0.20)', lift: '0 12px 36px -14px rgba(15,27,45,0.25)' },
    },
  },
  plugins: [],
};
