/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        montserrat: ['"Montserrat"', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
        cinzel: ['"Cinzel"', 'serif'],
        outfit: ['"Outfit"', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
        lora: ['"Lora"', 'serif'],
        pacifico: ['"Pacifico"', 'cursive'],
        space: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
