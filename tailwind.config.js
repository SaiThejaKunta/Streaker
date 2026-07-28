/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // STREAKER brand colors
        brand: {
          bg: '#0F0F1A',
          card: '#1A1A2E',
          'card-hover': '#252542',
          input: '#1E1E35',
          border: '#2A2A45',
          'border-light': '#3A3A55',
        },
        accent: {
          orange: '#FF6B35',
          amber: '#FFA726',
          blue: '#4FC3F7',
        },
        streaker: {
          success: '#66BB6A',
          danger: '#EF5350',
          'text-primary': '#FAFAFA',
          'text-secondary': '#9E9EAF',
          'text-muted': '#6B6B80',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
