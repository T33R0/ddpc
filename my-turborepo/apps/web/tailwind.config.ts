import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config";

const config: Pick<Config, "content" | "presets" | "theme"> = {
  content: [
    "./src/app/**/*.tsx",
    "../../packages/ui/src/**/*.tsx",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      backgroundImage: {
        'gradient-orbital': 'linear-gradient(to bottom right, theme("colors.indigo.500"), theme("colors.blue.500"), theme("colors.teal.500"))',
      },
      boxShadow: {
        'orbital': '0 0 15px rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
    },
  },
  presets: [sharedConfig],
};

export default config;
