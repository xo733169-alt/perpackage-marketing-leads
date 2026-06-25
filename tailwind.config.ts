import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        charcoal: "#2b2926",
        ivory: "#f7f2e8",
        paper: "#fbfaf7",
        line: "#e4ded2",
        brass: "#b88946"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(30, 28, 24, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
