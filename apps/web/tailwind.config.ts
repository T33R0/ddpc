import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config";
import defaultTheme from "tailwindcss/defaultTheme"; // Import default theme

const config: Pick<Config, "content" | "presets" | "theme"> = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // FIX 1: Scan EVERYTHING in src (components, lib, etc.)
    "../../packages/ui/src/**/*.tsx",
  ],
  theme: {
    // FIX 2: Explicitly restore default breakpoints in case sharedConfig wiped them
    screens: {
      ...defaultTheme.screens,
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
    },
  },
  presets: [sharedConfig],
};

export default config;