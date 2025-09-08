/**
 * Shadcn UI theme overrides so every component pulls from tokens.css.
 */

export const wbTheme = {
  colors: {
    primary: "hsl(var(--wb-color-accent) / <alpha-value>)",
    foreground: "hsl(var(--wb-gray-900) / <alpha-value>)",
    background: "hsl(var(--wb-color-white) / <alpha-value>)",
    muted: "hsl(var(--wb-gray-500) / <alpha-value>)",
  },
  radius: {
    sm: "var(--wb-radius-sm)",
    md: "var(--wb-radius-md)",
    lg: "var(--wb-radius-lg)"
  },
  shadow: {
    sm: "var(--wb-elev-sm)",
    md: "var(--wb-elev-md)",
    lg: "var(--wb-elev-lg)"
  },
};
