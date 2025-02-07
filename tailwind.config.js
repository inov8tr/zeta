/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#245692',
        'brand-primary-light': '#4a7db7',
        'brand-primary-dark': '#1c3c62',
        'brand-accent': '#fecc4c',
        'brand-accent-dark': '#d9a840',
        'neutral-lightest': '#fffefc',
        'neutral-muted': '#9ea8c7',
      },
    },
  },
  plugins: [],
};
