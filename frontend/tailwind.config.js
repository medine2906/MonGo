/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: {
    // Prevent Tailwind's reset from overriding existing global.css styles
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
