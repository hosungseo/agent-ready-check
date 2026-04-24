import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0a0a0a",
          soft: "#1a1a1a",
        },
        paper: {
          DEFAULT: "#fafaf7",
          warm: "#f4f1ea",
        },
        accent: {
          DEFAULT: "#0f766e",
          soft: "#14b8a6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
