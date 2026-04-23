import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#332F78",
        primaryDark: "#2A265F",
        success: "#10B981",
        inkBody: "#1F2937",
        mute: "#6B7280"
      }
    }
  },
  plugins: []
};

export default config;
