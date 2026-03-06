import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f8ff",
          100: "#dbefff",
          500: "#1570ef",
          700: "#0e4fb5",
        },
      },
      boxShadow: {
        card: "0 8px 30px rgba(2, 12, 27, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
