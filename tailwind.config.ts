import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      keyframes: {
        flow: {
          from: { strokeDashoffset: "24" },
          to: { strokeDashoffset: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        waveform: "flow 1s linear infinite",
        "in": "fade-in 0.5s ease-out forwards",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
                backgroundColor: 'transparent',
                padding: '0',
                margin: '0',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: theme('colors.green.700'),
              padding: '0',
            },
            '.dark pre code': {
                color: theme('colors.lime.400'),
            }
          },
        },
      }),
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
