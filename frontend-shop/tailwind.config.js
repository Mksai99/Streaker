/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81',
        },
        accent: { 400: '#f472b6', 500: '#ec4899', 600: '#db2777' },
        streak: { orange: '#f97316', red: '#ef4444', yellow: '#eab308' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem', '2xl': '1rem', '3xl': '1.5rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } },
        glow: { from: { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }, to: { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' } },
      },
    },
  },
  plugins: [],
}
