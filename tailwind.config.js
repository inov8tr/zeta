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
        'student-primary': '#1f6f8b',
        'student-primary-light': '#399bb5',
        'teacher-primary': '#fecc4c',
        'teacher-primary-light': '#ffe08b',
        'teacher-primary-dark': '#0a6aa4',
        'teacher-primary-text': '#0a6aa4',
        'neutral-lightest': '#fffefc',
        'neutral-muted': '#9ea8c7',
      },
      clipPath: {
        pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
      },
      boxShadow: {
        'pentagon-hover': '0 8px 15px rgba(0, 0, 0, 0.1)',
      },
      scale: {
        '105': '1.05',
      },
    },
  },
  plugins: [],
};
