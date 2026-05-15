import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Press Start 2P"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
