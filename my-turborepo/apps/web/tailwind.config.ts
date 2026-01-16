import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config";

const config: Pick<Config, "content" | "presets" | "theme"> = {
  content: [
    "./src/app/**/*.tsx",
    "../../packages/ui/src/**/*.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
    },
  },
  presets: [sharedConfig],
};

export default config;
