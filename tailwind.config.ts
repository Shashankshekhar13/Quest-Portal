import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d8ecff",
          200: "#b9deff",
          300: "#89cbff",
          400: "#52aeff",
          500: "#2a8dff",
          600: "#136df5",
          700: "#0c57e1",
          800: "#1047b6",
          900: "#143f8f",
          950: "#112857",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
