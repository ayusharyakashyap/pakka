import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14110F",
        paper: "#FFF8EE",
        sun: "#FFC83D",
        chili: "#FF5A36",
        leaf: "#1FA37A",
        sky: "#4D7CFE",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: { hard: "4px 4px 0 0 #14110F", hardsm: "2px 2px 0 0 #14110F" },
    },
  },
  plugins: [],
};
export default config;
