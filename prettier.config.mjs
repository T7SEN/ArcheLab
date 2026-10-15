/** @type {import("prettier").Config} */
const config = {
  // Must be the last plugin.
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4 reads the theme from the stylesheet, not a JS config.
  tailwindStylesheet: "./src/styles/globals.css",
};

export default config;
