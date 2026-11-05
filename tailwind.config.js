/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        relat3: {
          bg: "#F3E9E2",
          surface: "#FAF5F0",
          primary: "#4A1E0D",
          terracotta: "#B35638",
          taupe: "#A67C6D",
          border: "#E5D5C8",
        },
      },
    },
  },
  plugins: [],
};

export default config;