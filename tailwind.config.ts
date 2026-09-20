import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* 設計方向 A：學院深藍 + 錄取綠 */
        primary: "#1E3A5F",
        "primary-soft": "#EAF0F7",
        "primary-border": "#C7D5E5",
        accent: "#16A34A",
        "background-gray": "#F8FAFC",
      },
    },
  },
  plugins: [],
} satisfies Config;
