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
        barbearia: {
          background: "#2e2d37",
          header: "#26242d",
          card: "#4b4950",
          accent: "#f2b63a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
