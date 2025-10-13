import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f0f0f",
        foreground: "#e5e5e5",
        primary: "#1a1a1a",
        secondary: "#2a2a2a",
        accent: "#d4af37",
      },
    },
  },
  plugins: [],
};
export default config;
