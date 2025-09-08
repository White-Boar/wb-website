import defaultTheme from "tailwindcss/defaultTheme.js";
import plugin from "tailwindcss/plugin.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{tsx,ts,jsx,js}",
    "./src/components/**/*.{tsx,ts,jsx,js}",
    "./src/lib/**/*.{tsx,ts,jsx,js}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--wb-font-heading)", ...defaultTheme.fontFamily.sans],
        body:    ["var(--wb-font-body)",    ...defaultTheme.fontFamily.sans],
        mono:    ["var(--wb-font-mono)",    ...defaultTheme.fontFamily.mono]
      },
      colors: {
        accent:      "rgb(var(--wb-color-accent) / <alpha-value>)",
        black:       "rgb(var(--wb-color-black)  / <alpha-value>)",
        white:       "rgb(var(--wb-color-white)  / <alpha-value>)",
        gray: {
          100: "rgb(var(--wb-gray-100) / <alpha-value>)",
          300: "rgb(var(--wb-gray-300) / <alpha-value>)",
          500: "rgb(var(--wb-gray-500) / <alpha-value>)",
          700: "rgb(var(--wb-gray-700) / <alpha-value>)",
          900: "rgb(var(--wb-gray-900) / <alpha-value>)",
        },
      },
      spacing: {
        0:  "var(--wb-space-0)",
        1:  "var(--wb-space-1)",
        2:  "var(--wb-space-2)",
        3:  "var(--wb-space-3)",
        4:  "var(--wb-space-4)",
        5:  "var(--wb-space-5)",
        6:  "var(--wb-space-6)",
        7:  "var(--wb-space-7)",
        8:  "var(--wb-space-8)",
      },
      borderRadius: {
        sm: "var(--wb-radius-sm)",
        md: "var(--wb-radius-md)",
        lg: "var(--wb-radius-lg)",
      },
      boxShadow: {
        sm: "var(--wb-elev-sm)",
        md: "var(--wb-elev-md)",
        lg: "var(--wb-elev-lg)",
      },
      maxWidth: {
        readable: "var(--wb-max-readable)",
        content:  "var(--wb-max-content)"
      }
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        html: { fontFamily: "var(--wb-font-body)" },
        h1:  { fontFamily: "var(--wb-font-heading)" },
        h2:  { fontFamily: "var(--wb-font-heading)" },
        h3:  { fontFamily: "var(--wb-font-heading)" },
      });
    })
  ]
};
