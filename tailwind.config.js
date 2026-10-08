/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // JS like `if (!visible)` would otherwise generate an unused `!visible` (!important) class
  blocklist: ['!visible'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans JP', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Refined accent (replaces stock violet app-wide): calm indigo-iris
        violet: {
          50:  '#f4f5ff',
          100: '#e8eaff',
          200: '#d3d7fe',
          300: '#b2b8fc',
          400: '#8c90f7',
          500: '#6d6cf0',
          600: '#5a52e3',
          700: '#4b42c8',
          800: '#3e38a1',
          900: '#35337f',
          950: '#1f1d4a',
        },
        // Warmer, softer neutrals (replaces stock slate app-wide)
        slate: {
          50:  '#f8f8fa',
          100: '#f1f1f4',
          200: '#e4e4ea',
          300: '#cfcfd8',
          400: '#9d9dab',
          500: '#71717f',
          600: '#555562',
          700: '#3d3d48',
          800: '#26262f',
          900: '#18181f',
          950: '#0e0e13',
        },
      },
      boxShadow: {
        sm:   '0 1px 2px rgb(16 16 24 / 0.05)',
        DEFAULT: '0 1px 3px rgb(16 16 24 / 0.07), 0 1px 2px rgb(16 16 24 / 0.04)',
        md:   '0 4px 12px -2px rgb(16 16 24 / 0.08), 0 2px 4px -2px rgb(16 16 24 / 0.04)',
        lg:   '0 12px 24px -6px rgb(16 16 24 / 0.10), 0 4px 8px -4px rgb(16 16 24 / 0.05)',
        xl:   '0 20px 40px -12px rgb(16 16 24 / 0.16)',
        '2xl':'0 28px 60px -16px rgb(16 16 24 / 0.25)',
      },
    },
  },
  plugins: [],
}
